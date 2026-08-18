import { getAssistantMaxHistory, isAssistantEnabled } from "./config";
import { chatWithOllama, isOllamaReachable } from "./ollama";
import { buildSystemPrompt } from "./prompts";
import { formatToolResultsForPrompt, runAssistantTools } from "./tools";
import { buildFallbackResponse, validateAssistantResponse } from "./validate";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantChatResult = {
  message: string;
  toolsUsed: string[];
  ollamaUsed: boolean;
};

export async function runAssistantChat(
  messages: ChatMessage[]
): Promise<AssistantChatResult> {
  if (!isAssistantEnabled()) {
    return {
      message: "Jalal Assistance is temporarily disabled. Please contact us at +92 313 5205272.",
      toolsUsed: [],
      ollamaUsed: false,
    };
  }

  const trimmed = messages.filter((m) => m.content.trim()).slice(-getAssistantMaxHistory());
  const lastUser = [...trimmed].reverse().find((m) => m.role === "user");

  if (!lastUser) {
    return {
      message: "Please send a message to start the conversation.",
      toolsUsed: [],
      ollamaUsed: false,
    };
  }

  const toolResults = await runAssistantTools({ message: lastUser.content });
  const toolsUsed = toolResults.map((r) => r.tool);
  const toolBlock = formatToolResultsForPrompt(toolResults);
  const systemPrompt = await buildSystemPrompt();

  const ollamaUp = await isOllamaReachable();

  if (!ollamaUp) {
    return {
      message: buildFallbackResponse(toolResults),
      toolsUsed,
      ollamaUsed: false,
    };
  }

  const ollamaMessages = [
    { role: "system" as const, content: systemPrompt },
    ...trimmed.slice(0, -1).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    {
      role: "user" as const,
      content: `${lastUser.content}\n\n${toolBlock}`,
    },
  ];

  try {
    const raw = await chatWithOllama(ollamaMessages);
    const validated = validateAssistantResponse(raw, toolResults);
    return { message: validated, toolsUsed, ollamaUsed: true };
  } catch {
    return {
      message: buildFallbackResponse(toolResults),
      toolsUsed,
      ollamaUsed: false,
    };
  }
}
