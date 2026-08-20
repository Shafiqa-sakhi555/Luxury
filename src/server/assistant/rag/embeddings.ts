import { getOllamaBaseUrl } from "../config";
import { getAssistantEmbedDimensions, getOllamaEmbedModel } from "./config";

type EmbedResponse = {
  embedding?: number[];
};

export async function embedText(text: string): Promise<number[]> {
  const baseUrl = getOllamaBaseUrl();
  const model = getOllamaEmbedModel();
  const expectedDim = getAssistantEmbedDimensions();

  const res = await fetch(`${baseUrl}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt: text.slice(0, 8000) }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Embedding failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as EmbedResponse;
  const embedding = data.embedding;
  if (!embedding?.length) throw new Error("Empty embedding returned");

  if (embedding.length !== expectedDim) {
    throw new Error(`Expected ${expectedDim} dimensions, got ${embedding.length}`);
  }

  return embedding;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    results.push(await embedText(text));
  }
  return results;
}
