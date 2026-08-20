export type KnowledgeChunkInput = {
  sourceType: string;
  sourceId: string;
  contentType: string;
  content: string;
  metadata?: Record<string, unknown>;
  verified?: boolean;
};

const CHUNK_SIZE = 700;
const CHUNK_OVERLAP = 120;

export function splitTextIntoChunks(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  if (normalized.length <= CHUNK_SIZE) return [normalized];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + CHUNK_SIZE, normalized.length);
    chunks.push(normalized.slice(start, end).trim());
    if (end >= normalized.length) break;
    start = Math.max(0, end - CHUNK_OVERLAP);
  }

  return chunks.filter(Boolean);
}

export function buildChunksFromDocument(input: {
  sourceType: string;
  sourceId: string;
  contentType: string;
  text: string;
  metadata?: Record<string, unknown>;
  verified?: boolean;
}): KnowledgeChunkInput[] {
  return splitTextIntoChunks(input.text).map((content, index) => ({
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    contentType: input.contentType,
    content,
    metadata: {
      ...(input.metadata ?? {}),
      chunkIndex: index,
    },
    verified: input.verified ?? true,
  }));
}

export function buildChunkFromJson(input: {
  sourceType: string;
  sourceId: string;
  contentType: string;
  data: unknown;
  verified?: boolean;
}): KnowledgeChunkInput[] {
  const text = JSON.stringify(input.data, null, 2);
  return buildChunksFromDocument({
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    contentType: input.contentType,
    text,
    verified: input.verified,
  });
}
