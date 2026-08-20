import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { loadFaqKnowledge } from "../knowledge/loader";
import { getAssistantRagTopK, isAssistantRagEnabled } from "./config";
import { embedText } from "./embeddings";

export type RagMatch = {
  sourceType: string;
  sourceId: string;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
};

async function keywordFallback(query: string, limit: number): Promise<RagMatch[]> {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const faq = await loadFaqKnowledge();
  return faq.faqs
    .filter((f) => f.verified !== false)
    .map((f) => {
      const haystack = `${f.question} ${f.answer}`.toLowerCase();
      const score =
        terms.reduce((acc, term) => (haystack.includes(term) ? acc + 1 : acc), 0) /
        Math.max(terms.length, 1);
      return {
        sourceType: "faq",
        sourceId: f.id,
        content: `Q: ${f.question}\nA: ${f.answer}`,
        similarity: score,
        metadata: { category: f.category },
      };
    })
    .filter((m) => m.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

export async function searchKnowledge(query: string): Promise<RagMatch[]> {
  if (!isAssistantRagEnabled()) return keywordFallback(query, getAssistantRagTopK());

  if (!isSupabaseConfigured()) {
    return keywordFallback(query, getAssistantRagTopK());
  }

  try {
    const embedding = await embedText(query);
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("match_assistant_knowledge", {
      query_embedding: JSON.stringify(embedding),
      match_count: getAssistantRagTopK(),
      min_similarity: 0.42,
    });

    if (error || !data?.length) {
      return keywordFallback(query, getAssistantRagTopK());
    }

    return (data as Array<{
      source_type: string;
      source_id: string;
      content: string;
      metadata: Record<string, unknown>;
      similarity: number;
    }>).map((row) => ({
      sourceType: row.source_type,
      sourceId: row.source_id,
      content: row.content,
      similarity: row.similarity,
      metadata: row.metadata ?? {},
    }));
  } catch {
    return keywordFallback(query, getAssistantRagTopK());
  }
}

export function formatRagContext(matches: RagMatch[]): string {
  if (matches.length === 0) {
    return "KNOWLEDGE CONTEXT: (no relevant chunks retrieved)";
  }

  return `KNOWLEDGE CONTEXT (verified static information — not for prices/stock):

${matches
  .map(
    (m, i) =>
      `[${i + 1}] (${m.sourceType}/${m.sourceId}, score ${m.similarity.toFixed(2)})\n${m.content}`
  )
  .join("\n\n")}`;
}
