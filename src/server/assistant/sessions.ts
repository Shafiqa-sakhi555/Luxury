import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ChatMessage } from "./chat";
import type { AssistantUserContext } from "./context";

export async function upsertAssistantSession(
  sessionKey: string,
  customerId?: string | null
) {
  const supabase = createSupabaseAdminClient();

  const { data: existing } = await supabase
    .from("assistant_sessions")
    .select("id, customer_id")
    .eq("session_key", sessionKey)
    .maybeSingle();

  if (existing) {
    if (customerId && !existing.customer_id) {
      await supabase
        .from("assistant_sessions")
        .update({ customer_id: customerId })
        .eq("id", existing.id);
    }
    return existing.id;
  }

  const { data, error } = await supabase
    .from("assistant_sessions")
    .insert({
      session_key: sessionKey,
      customer_id: customerId ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return data.id;
}

export async function persistAssistantExchange(input: {
  sessionKey: string;
  userContext: AssistantUserContext;
  userMessage: string;
  assistantMessage: string;
  toolsUsed: string[];
  ollamaUsed: boolean;
}) {
  const sessionId = await upsertAssistantSession(
    input.sessionKey,
    input.userContext.customerId
  );
  if (!sessionId) return;

  const supabase = createSupabaseAdminClient();
  await supabase.from("assistant_messages").insert([
    {
      session_id: sessionId,
      role: "user",
      content: input.userMessage,
      tools_used: null,
      ollama_used: false,
    },
    {
      session_id: sessionId,
      role: "assistant",
      content: input.assistantMessage,
      tools_used: input.toolsUsed,
      ollama_used: input.ollamaUsed,
    },
  ]);
}

export async function createHandoffRequest(input: {
  sessionKey: string;
  userContext: AssistantUserContext;
  issueSummary: string;
  messages: ChatMessage[];
  contactPhone?: string;
}) {
  const supabase = createSupabaseAdminClient();
  const sessionId = await upsertAssistantSession(
    input.sessionKey,
    input.userContext.customerId
  );

  const { data, error } = await supabase
    .from("assistant_handoff_requests")
    .insert({
      session_id: sessionId,
      session_key: input.sessionKey,
      customer_id: input.userContext.customerId,
      contact_name: input.userContext.name,
      contact_email: input.userContext.email,
      contact_phone: input.contactPhone ?? null,
      issue_summary: input.issueSummary,
      conversation_snapshot: input.messages.slice(-10),
      status: "PENDING",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}
