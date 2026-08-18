import { getAssistantMaxHistory, isAssistantEnabled } from "./config";
import type { AssistantUserContext } from "./context";
import { runConsultation, type ConsultationResult } from "./consultation";
import type { ConsultationRecommendation } from "./consultation/recommend";
import { chatWithOllama, isOllamaReachable, streamChatWithOllama } from "./ollama";
import { buildSystemPrompt } from "./prompts";
import { formatRagContext, searchKnowledge } from "./rag/search";
import { persistAssistantExchange } from "./sessions";
import { formatToolResultsForPrompt, runAssistantTools } from "./tools";
import { buildFallbackResponse, validateAssistantResponse } from "./validate";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantChatOptions = {
  sessionKey?: string;
  userContext?: AssistantUserContext;
  persist?: boolean;
};

export type AssistantChatResult = {
  message: string;
  toolsUsed: string[];
  ollamaUsed: boolean;
  requiresLogin?: boolean;
  handoffCreated?: boolean;
  consultation?: {
    mode: ConsultationResult["mode"];
    profileSummary?: string;
    nextQuestion?: string;
    recommendations?: ConsultationRecommendation[];
    suggestedReplies?: string[];
  };
};

type PreparedRun = {
  trimmed: ChatMessage[];
  lastUser: ChatMessage;
  toolResults: Awaited<ReturnType<typeof runAssistantTools>>;
  toolsUsed: string[];
  toolBlock: string;
  ragBlock: string;
  systemPrompt: string;
  consultationState: ConsultationResult;
  consultationMeta: AssistantChatResult["consultation"];
  consultationInstruction: string;
  ollamaMessages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  requiresLogin: boolean;
  handoffCreated: boolean;
};

async function prepareRun(
  messages: ChatMessage[],
  options: AssistantChatOptions
): Promise<PreparedRun | { error: AssistantChatResult }> {
  const trimmed = messages.filter((m) => m.content.trim()).slice(-getAssistantMaxHistory());
  const lastUser = [...trimmed].reverse().find((m) => m.role === "user");

  if (!lastUser) {
    return {
      error: {
        message: "Please send a message to start the conversation.",
        toolsUsed: [],
        ollamaUsed: false,
      },
    };
  }

  const toolCtx = {
    message: lastUser.content,
    messages: trimmed,
    sessionKey: options.sessionKey,
    userContext: options.userContext,
  };

  const [toolResults, ragMatches, consultationState] = await Promise.all([
    runAssistantTools(toolCtx),
    searchKnowledge(lastUser.content),
    runConsultation(trimmed),
  ]);

  const toolsUsed = toolResults.map((r) => r.tool);
  const requiresLogin = toolResults.some((r) => {
    const data = r.data as { authenticated?: boolean };
    return (r.tool === "get_my_orders" || r.tool === "get_order_status") && data.authenticated === false;
  });
  const handoffCreated = toolResults.some((r) => r.tool === "request_handoff");

  const consultationMeta =
    consultationState.mode !== "not_consultation"
      ? {
          mode: consultationState.mode,
          profileSummary: consultationState.profileSummary,
          nextQuestion: consultationState.nextQuestion,
          recommendations: consultationState.recommendations,
          suggestedReplies: consultationState.suggestedReplies,
        }
      : undefined;

  const consultationInstruction =
    consultationState.mode === "gather_info"
      ? `\nCONSULTATION MODE: Ask the customer: "${consultationState.nextQuestion}". Do not invent product recommendations yet.`
      : consultationState.mode === "recommend"
        ? `\nCONSULTATION MODE: Explain the recommended products from tool results for ${consultationState.profileSummary}.`
        : "";

  const systemPrompt = await buildSystemPrompt(options.userContext);

  return {
    trimmed,
    lastUser,
    toolResults,
    toolsUsed,
    toolBlock: formatToolResultsForPrompt(toolResults),
    ragBlock: formatRagContext(ragMatches),
    systemPrompt,
    consultationState,
    consultationMeta,
    consultationInstruction,
    requiresLogin,
    handoffCreated,
    ollamaMessages: [
      { role: "system", content: `${systemPrompt}${consultationInstruction}` },
      ...trimmed.slice(0, -1).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      {
        role: "user",
        content: `${lastUser.content}\n\n${formatRagContext(ragMatches)}\n\n${formatToolResultsForPrompt(toolResults)}`,
      },
    ],
  };
}

async function maybePersist(
  options: AssistantChatOptions,
  lastUser: ChatMessage,
  message: string,
  toolsUsed: string[],
  ollamaUsed: boolean
) {
  if (!options.persist || !options.sessionKey) return;
  await persistAssistantExchange({
    sessionKey: options.sessionKey,
    userContext: options.userContext ?? {
      userId: null,
      customerId: null,
      email: null,
      name: null,
      isAuthenticated: false,
    },
    userMessage: lastUser.content,
    assistantMessage: message,
    toolsUsed,
    ollamaUsed,
  });
}

export async function runAssistantChat(
  messages: ChatMessage[],
  options: AssistantChatOptions = {}
): Promise<AssistantChatResult> {
  if (!isAssistantEnabled()) {
    return {
      message: "Jalal Assistance is temporarily disabled. Please contact us at +92 313 5205272.",
      toolsUsed: [],
      ollamaUsed: false,
    };
  }

  const prepared = await prepareRun(messages, options);
  if ("error" in prepared) return prepared.error;

  const {
    lastUser,
    toolResults,
    toolsUsed,
    consultationState,
    consultationMeta,
    ollamaMessages,
    requiresLogin,
    handoffCreated,
  } = prepared;

  const ollamaUp = await isOllamaReachable();

  if (!ollamaUp) {
    const message = buildFallbackResponse(toolResults, consultationState);
    await maybePersist(options, lastUser, message, toolsUsed, false);
    return {
      message,
      toolsUsed,
      ollamaUsed: false,
      consultation: consultationMeta,
      requiresLogin,
      handoffCreated,
    };
  }

  try {
    const raw = await chatWithOllama(ollamaMessages);
    const validated = validateAssistantResponse(raw, toolResults);
    await maybePersist(options, lastUser, validated, toolsUsed, true);
    return {
      message: validated,
      toolsUsed,
      ollamaUsed: true,
      consultation: consultationMeta,
      requiresLogin,
      handoffCreated,
    };
  } catch {
    const message = buildFallbackResponse(toolResults, consultationState);
    await maybePersist(options, lastUser, message, toolsUsed, false);
    return {
      message,
      toolsUsed,
      ollamaUsed: false,
      consultation: consultationMeta,
      requiresLogin,
      handoffCreated,
    };
  }
}

export async function* streamAssistantChat(
  messages: ChatMessage[],
  options: AssistantChatOptions = {}
): AsyncGenerator<
  { type: "meta"; data: Partial<AssistantChatResult> } | { type: "token"; data: string },
  AssistantChatResult,
  undefined
> {
  if (!isAssistantEnabled()) {
    return {
      message: "Jalal Assistance is temporarily disabled.",
      toolsUsed: [],
      ollamaUsed: false,
    };
  }

  const prepared = await prepareRun(messages, options);
  if ("error" in prepared) {
    return prepared.error;
  }

  const {
    lastUser,
    toolResults,
    toolsUsed,
    consultationState,
    consultationMeta,
    ollamaMessages,
    requiresLogin,
    handoffCreated,
  } = prepared;

  yield {
    type: "meta",
    data: {
      toolsUsed,
      consultation: consultationMeta,
      requiresLogin,
      handoffCreated,
    },
  };

  const ollamaUp = await isOllamaReachable();
  if (!ollamaUp) {
    const message = buildFallbackResponse(toolResults, consultationState);
    await maybePersist(options, lastUser, message, toolsUsed, false);
    return {
      message,
      toolsUsed,
      ollamaUsed: false,
      consultation: consultationMeta,
      requiresLogin,
      handoffCreated,
    };
  }

  try {
    let full = "";
    for await (const token of streamChatWithOllama(ollamaMessages)) {
      full += token;
      yield { type: "token", data: token };
    }

    const validated = validateAssistantResponse(full.trim(), toolResults);
    await maybePersist(options, lastUser, validated, toolsUsed, true);
    return {
      message: validated,
      toolsUsed,
      ollamaUsed: true,
      consultation: consultationMeta,
      requiresLogin,
      handoffCreated,
    };
  } catch {
    const message = buildFallbackResponse(toolResults, consultationState);
    await maybePersist(options, lastUser, message, toolsUsed, false);
    return {
      message,
      toolsUsed,
      ollamaUsed: false,
      consultation: consultationMeta,
      requiresLogin,
      handoffCreated,
    };
  }
}
