export function getOllamaEmbedModel() {
  return process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";
}

export function getAssistantRagTopK() {
  return Math.min(10, Math.max(1, Number(process.env.ASSISTANT_RAG_TOP_K ?? 5)));
}

export function isAssistantRagEnabled() {
  return process.env.ASSISTANT_RAG_ENABLED !== "false";
}

export function getAssistantEmbedDimensions() {
  return Number(process.env.ASSISTANT_EMBED_DIMENSIONS ?? 768);
}
