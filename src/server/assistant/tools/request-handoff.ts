import { createHandoffRequest } from "../sessions";
import type { ToolContext, ToolResult } from "./types";

const HANDOFF_TRIGGERS =
  /\b(speak to (a )?(human|person|agent|someone)|talk to (a )?(human|person|agent|staff)|call me back|human help|real person|manager|complaint|escalate)\b/i;

function buildIssueSummary(message: string, messages?: ToolContext["messages"]) {
  const recentUser = (messages ?? [])
    .filter((m) => m.role === "user")
    .slice(-3)
    .map((m) => m.content)
    .join(" | ");

  return recentUser || message;
}

export async function runRequestHandoff(ctx: ToolContext): Promise<ToolResult | null> {
  if (!HANDOFF_TRIGGERS.test(ctx.message)) return null;

  const issueSummary = buildIssueSummary(ctx.message, ctx.messages);

  try {
    const handoffId = await createHandoffRequest({
      sessionKey: ctx.sessionKey ?? "unknown",
      userContext: ctx.userContext ?? {
        userId: null,
        customerId: null,
        email: null,
        name: null,
        isAuthenticated: false,
      },
      issueSummary,
      messages: ctx.messages ?? [{ role: "user", content: ctx.message }],
    });

    return {
      tool: "request_handoff",
      summary: "Human handoff request created.",
      data: {
        handoffId,
        status: "PENDING",
        issueSummary,
        contact: {
          phone: "+92 313 5205272",
          email: "info@jalalshome.pk",
          ordersEmail: "orders@jalalsgroup.com",
        },
        instruction:
          "Confirm a team member will follow up. Share main contact details. Do not promise exact callback time.",
      },
    };
  } catch {
    return {
      tool: "request_handoff",
      summary: "Could not create handoff ticket — provide direct contact details.",
      data: {
        status: "FAILED",
        contact: {
          phone: "+92 313 5205272",
          email: "info@jalalshome.pk",
        },
        instruction: "Direct customer to call or email directly.",
      },
    };
  }
}
