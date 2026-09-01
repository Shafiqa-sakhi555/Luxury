import { loadFaqKnowledge } from "../knowledge/loader";
import type { ToolContext, ToolResult } from "./types";

  const TRIGGERS = [
    "faq",
    "how do",
    "how long",
    "how can",
    "can i",
    "do you",
    "does jalal",
    "what is your",
    "what are your",
    "who is jalal",
    "when was",
    "founded",
    "established",
    "free delivery",
    "deliver",
    "custom size",
    "showroom",
    "payment",
    "cod",
    "cash on delivery",
    "account",
    "track",
    "return",
    "install",
    "delivery",
    "warranty",
  ];

function looksLikeQuestion(message: string) {
  const trimmed = message.trim();
  return (
    trimmed.includes("?") ||
    /^(who|what|when|where|why|how|can|do|does|is|are|will)\b/i.test(trimmed)
  );
}

export async function runSearchFaq(ctx: ToolContext): Promise<ToolResult | null> {
  const lower = ctx.message.toLowerCase();
  if (!looksLikeQuestion(ctx.message) && !TRIGGERS.some((t) => lower.includes(t))) {
    return null;
  }

  const faq = await loadFaqKnowledge();
  const terms = lower
    .split(/\s+/)
    .map((w) => w.replace(/[^\w-]/g, ""))
    .filter((w) => w.length > 2);

  const scored = faq.faqs
    .filter((f) => f.verified !== false)
    .map((f) => {
      const haystack = `${f.question} ${f.answer} ${f.category}`.toLowerCase();
      const score = terms.reduce((acc, term) => (haystack.includes(term) ? acc + 1 : acc), 0);
      return { ...f, score };
    })
    .filter((f) => f.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  if (scored.length === 0) {
    return {
      tool: "search_faq",
      summary: "No FAQ entries matched.",
      data: { matches: [] },
    };
  }

  return {
    tool: "search_faq",
    summary: `Found ${scored.length} FAQ match(es).`,
    data: {
      matches: scored.map((f) => ({
        question: f.question,
        answer: f.answer,
        category: f.category,
      })),
    },
  };
}
