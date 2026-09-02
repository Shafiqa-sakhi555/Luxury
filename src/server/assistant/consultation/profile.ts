import type { ChatMessage } from "../chat";

export type ConsultationProfile = {
  room?: string;
  style?: string;
  color?: string;
  material?: string;
  budgetMaxMinor?: number;
  categorySlug?: string;
  isConsultation: boolean;
};

const CONSULTATION_TRIGGERS =
  /\b(design (my|our|the|this)?\s*(room|home|space|house)?|decorate|furnish(ing)? my|help me (choose|pick|design)|what goes with|coordinate|look for ideas|ideas for (my|the)|interior (design|advice))\b/i;

const FACTUAL_QUESTION =
  /\b(deliver|delivery|shipping|return|refund|warranty|install|payment|cod|cash on delivery|track|order|cart|showroom|store|branch|hours|phone|contact|price of|do you sell|what do you sell|who is|where are|free delivery)\b/i;

function userMessagesText(messages: ChatMessage[]) {
  return messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n");
}

function lastUserMessage(messages: ChatMessage[]) {
  return [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
}

export function isFactualLookup(message: string) {
  return FACTUAL_QUESTION.test(message);
}

export function detectConsultationIntent(messages: ChatMessage[]): boolean {
  const lastUser = lastUserMessage(messages);
  if (!lastUser) return false;
  if (isFactualLookup(lastUser)) return false;

  const userText = userMessagesText(messages);
  return CONSULTATION_TRIGGERS.test(lastUser) || CONSULTATION_TRIGGERS.test(userText);
}

const ROOM_PATTERNS: Array<{ id: string; patterns: RegExp[] }> = [
  { id: "living_room", patterns: [/living room/, /lounge/, /sitting room/, /drawing room/] },
  { id: "bedroom", patterns: [/bedroom/, /master bed/, /guest room/] },
  { id: "prayer_space", patterns: [/prayer space/, /prayer room/, /musalla/, /namaz/] },
  { id: "office", patterns: [/office/, /study room/, /workspace/] },
  { id: "dining_room", patterns: [/dining room/, /dining area/] },
  { id: "kitchen", patterns: [/kitchen/] },
  { id: "bathroom", patterns: [/bathroom/] },
];

const STYLE_PATTERNS: Array<{ id: string; patterns: RegExp[] }> = [
  { id: "modern", patterns: [/modern/, /contemporary/] },
  { id: "traditional", patterns: [/traditional/, /classic/, /heritage/] },
  { id: "luxury", patterns: [/luxury/, /premium/, /regal/, /persian/] },
  { id: "minimal", patterns: [/minimal/, /minimalist/, /simple/] },
  { id: "cozy", patterns: [/cozy/, /cosy/, /warm and soft/, /plush/] },
];

const COLOR_PATTERNS: Array<{ id: string; patterns: RegExp[] }> = [
  { id: "light", patterns: [/light colour/, /light color/, /\blight\b/, /white/, /cream/, /beige/, /pastel/] },
  { id: "dark", patterns: [/dark colour/, /dark color/, /\bdark\b/, /navy/, /charcoal/, /black/, /burgundy/] },
  { id: "warm", patterns: [/warm tone/, /warm colour/, /mustard/, /gold tone/, /terracotta/, /red tone/] },
  { id: "cool", patterns: [/cool tone/, /cool colour/, /\bblue\b/, /teal/, /green tone/] },
];

const MATERIAL_PATTERNS: Array<{ id: string; patterns: RegExp[] }> = [
  { id: "toweling_weave", patterns: [/towel fabric/, /toweling/, /towelling/] },
  { id: "malai_fabric", patterns: [/malai/] },
  { id: "wall_to_wall", patterns: [/wall-to-wall/, /wall to wall/] },
];

const CATEGORY_PATTERNS: Array<{ slug: string; patterns: RegExp[] }> = [
  { slug: "curtains", patterns: [/curtain/, /drape/] },
  { slug: "carpets", patterns: [/carpet/, /\brug\b/, /flooring/] },
  { slug: "prayer-mats", patterns: [/prayer mat/, /prayer-mat/, /janamaz/] },
  { slug: "furniture", patterns: [/furniture/, /dining set/] },
  { slug: "table", patterns: [/\btable\b/, /dining table/, /coffee table/] },
  { slug: "sofa", patterns: [/sofa/, /sectional/] },
  { slug: "beds", patterns: [/\bbed\b/, /bedroom set/] },
  { slug: "chair", patterns: [/chair/] },
];

function matchFirst(text: string, entries: Array<{ id: string; patterns: RegExp[] }>) {
  const lower = text.toLowerCase();
  for (const entry of entries) {
    if (entry.patterns.some((p) => p.test(lower))) return entry.id;
  }
  return undefined;
}

function extractBudgetMinor(text: string): number | undefined {
  const patterns = [
    /(?:under|below|max|budget|upto|up to)\s*(?:rs\.?|pkr)?\s*([\d,]+(?:\.\d+)?)/i,
    /(?:rs\.?|pkr)\s*([\d,]+(?:\.\d+)?)/i,
    /\b([\d,]{4,})\s*(?:rs|pkr)?\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const major = Number(match[1].replace(/,/g, ""));
      if (Number.isFinite(major) && major > 0) return Math.round(major * 100);
    }
  }
  return undefined;
}

export function extractProfile(messages: ChatMessage[]): ConsultationProfile {
  const text = userMessagesText(messages);
  const lastUser = lastUserMessage(messages) || text;

  return {
    room: matchFirst(lastUser, ROOM_PATTERNS) ?? matchFirst(text, ROOM_PATTERNS),
    style: matchFirst(lastUser, STYLE_PATTERNS) ?? matchFirst(text, STYLE_PATTERNS),
    color: matchFirst(lastUser, COLOR_PATTERNS) ?? matchFirst(text, COLOR_PATTERNS),
    material: matchFirst(lastUser, MATERIAL_PATTERNS) ?? matchFirst(text, MATERIAL_PATTERNS),
    budgetMaxMinor: extractBudgetMinor(lastUser) ?? extractBudgetMinor(text),
    categorySlug: CATEGORY_PATTERNS.find((c) => c.patterns.some((p) => p.test(lastUser) || p.test(text)))?.slug,
    isConsultation: detectConsultationIntent(messages),
  };
}

export type ConsultationField = {
  id: string;
  question: string;
  priority: number;
  required: boolean;
};

export async function getMissingConsultationFields(
  profile: ConsultationProfile
): Promise<ConsultationField[]> {
  const { loadConsultationQuestions } = await import("../knowledge/loader");
  const config = (await loadConsultationQuestions()) as {
    fields: Array<{
      id: string;
      question: string;
      priority: number;
      required_for_recommendation?: boolean;
    }>;
  };

  const known: Record<string, unknown> = {
    room: profile.room,
    preferred_style: profile.style,
    preferred_colors: profile.color,
    material_preference: profile.material,
    budget: profile.budgetMaxMinor,
  };

  return config.fields
    .filter((field) => {
      if (!field.required_for_recommendation) return false;
      return !known[field.id];
    })
    .sort((a, b) => a.priority - b.priority)
    .map((field) => ({
      id: field.id,
      question: field.question,
      priority: field.priority,
      required: Boolean(field.required_for_recommendation),
    }));
}

export function profileSummary(profile: ConsultationProfile): string {
  const parts: string[] = [];
  if (profile.room) parts.push(`room: ${profile.room.replace(/_/g, " ")}`);
  if (profile.style) parts.push(`style: ${profile.style}`);
  if (profile.color) parts.push(`colours: ${profile.color}`);
  if (profile.material) parts.push(`material: ${profile.material.replace(/_/g, " ")}`);
  if (profile.budgetMaxMinor) parts.push(`budget: up to PKR ${profile.budgetMaxMinor / 100}`);
  if (profile.categorySlug) parts.push(`category: ${profile.categorySlug}`);
  return parts.length ? parts.join(", ") : "not yet specified";
}
