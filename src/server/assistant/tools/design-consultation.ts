import { runConsultation } from "../consultation";
import type { ChatMessage } from "../chat";
import type { ToolContext, ToolResult } from "./types";

export async function runDesignConsultation(ctx: ToolContext): Promise<ToolResult | null> {
  const messages = ctx.messages ?? [{ role: "user" as const, content: ctx.message }];
  const consultation = await runConsultation(messages as ChatMessage[]);

  if (consultation.mode === "not_consultation") return null;

  if (consultation.mode === "gather_info") {
    return {
      tool: "design_consultation",
      summary: `Consultation in progress — need ${consultation.missingFields[0]?.id ?? "more details"}.`,
      data: {
        mode: "gather_info",
        profile: consultation.profile,
        profileSummary: consultation.profileSummary,
        missingFields: consultation.missingFields,
        nextQuestion: consultation.nextQuestion,
        suggestedReplies: consultation.suggestedReplies,
        instruction:
          "Ask ONLY the next consultation question naturally. Do not recommend specific products yet.",
      },
    };
  }

  return {
    tool: "design_consultation",
    summary: `Design consultation — ${consultation.recommendations.length} recommendation(s) from live catalog.`,
    data: {
      mode: "recommend",
      profile: consultation.profile,
      profileSummary: consultation.profileSummary,
      designGuidance: consultation.designGuidance,
      matchedRuleId: consultation.matchedRuleId,
      recommendations: consultation.recommendations,
      suggestedReplies: consultation.suggestedReplies,
      instruction:
        "Explain recommendations using ONLY the products listed below. Mention price and why each fits the customer's room/style.",
    },
  };
}
