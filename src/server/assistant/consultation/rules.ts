import { loadConsultationRules } from "../knowledge/loader";
import type { ConsultationProfile } from "./profile";

export type MatchedConsultationRule = {
  id: string;
  explain: string;
  search: {
    categories?: string[];
    color_hints?: string[];
    style_hints?: string[];
    material_hints?: string[];
    sort_by?: string;
    require_availability?: boolean;
  };
  score: number;
};

function ruleMatches(when: Record<string, unknown>, profile: ConsultationProfile) {
  let score = 0;

  if (when.room && profile.room === when.room) score += 3;
  else if (when.room) return null;

  if (when.style && profile.style === when.style) score += 3;
  else if (when.style) return null;

  if (when.color && profile.color === when.color) score += 2;
  else if (when.color) return null;

  if (when.budget_max && profile.budgetMaxMinor) score += 1;

  return score;
}

export async function matchConsultationRules(
  profile: ConsultationProfile
): Promise<MatchedConsultationRule[]> {
  const rulesDoc = (await loadConsultationRules()) as {
    rules: Array<{
      id: string;
      when: Record<string, unknown>;
      search: MatchedConsultationRule["search"];
      explain: string;
    }>;
  };

  const matched: MatchedConsultationRule[] = [];

  for (const rule of rulesDoc.rules) {
    const score = ruleMatches(rule.when, profile);
    if (score != null && score > 0) {
      matched.push({
        id: rule.id,
        explain: rule.explain,
        search: rule.search,
        score,
      });
    }
  }

  if (matched.length === 0 && profile.room && profile.style) {
    matched.push({
      id: "generic-room-style",
      explain: `Recommend ${profile.style} options suitable for a ${profile.room.replace(/_/g, " ")}.`,
      search: {
        categories: profile.categorySlug ? [profile.categorySlug] : ["curtains", "carpets", "prayer-mats"],
        color_hints: profile.color ? [profile.color] : undefined,
        style_hints: [profile.style],
        require_availability: true,
      },
      score: 1,
    });
  }

  return matched.sort((a, b) => b.score - a.score);
}
