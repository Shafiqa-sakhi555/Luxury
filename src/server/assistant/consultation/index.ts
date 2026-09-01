import { loadDesignKnowledge } from "../knowledge/loader";
import {
  detectConsultationIntent,
  extractProfile,
  getMissingConsultationFields,
  profileSummary,
} from "./profile";
import { matchConsultationRules } from "./rules";
import { recommendConsultationProducts } from "./recommend";
import type { ChatMessage } from "../chat";

export type ConsultationResult = {
  mode: "gather_info" | "recommend" | "not_consultation";
  profile: ReturnType<typeof extractProfile>;
  profileSummary: string;
  missingFields: Awaited<ReturnType<typeof getMissingConsultationFields>>;
  nextQuestion?: string;
  designGuidance?: string;
  matchedRuleId?: string;
  recommendations: Awaited<ReturnType<typeof recommendConsultationProducts>>;
  suggestedReplies: string[];
};

const REPLY_SUGGESTIONS: Record<string, string[]> = {
  room: ["Living room", "Bedroom", "Dining room", "Prayer space"],
  preferred_style: ["Modern", "Traditional", "Luxury", "Minimal", "Cozy"],
  preferred_colors: ["Light colours", "Dark colours", "Warm tones", "Cool tones"],
};

export async function runConsultation(messages: ChatMessage[]): Promise<ConsultationResult> {
  const profile = extractProfile(messages);
  const isConsultation = detectConsultationIntent(messages);

  if (!isConsultation) {
    return {
      mode: "not_consultation",
      profile,
      profileSummary: profileSummary(profile),
      missingFields: [],
      recommendations: [],
      suggestedReplies: [],
    };
  }

  const missingFields = await getMissingConsultationFields(profile);
  const summary = profileSummary(profile);

  if (missingFields.length > 0) {
    const next = missingFields[0];
    return {
      mode: "gather_info",
      profile,
      profileSummary: summary,
      missingFields,
      nextQuestion: next.question,
      recommendations: [],
      suggestedReplies: REPLY_SUGGESTIONS[next.id] ?? [],
    };
  }

  const rules = await matchConsultationRules(profile);
  const recommendations = await recommendConsultationProducts({ profile, rules });
  const design = (await loadDesignKnowledge()) as {
    rooms?: Array<{ id: string; preferred_characteristics?: string[] }>;
  };

  const roomGuide = design.rooms?.find((r) => r.id === profile.room);
  const designGuidance = [
    rules[0]?.explain,
    roomGuide?.preferred_characteristics?.length
      ? `Room tips: ${roomGuide.preferred_characteristics.join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    mode: "recommend",
    profile,
    profileSummary: summary,
    missingFields: [],
    designGuidance,
    matchedRuleId: rules[0]?.id,
    recommendations,
    suggestedReplies: recommendations.length
      ? recommendations.map((r) => `Tell me more about ${r.name}`)
      : ["Show curtains instead", "Try a different style"],
  };
}
