export function getOllamaBaseUrl() {
  return process.env.OLLAMA_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:11434";
}

export function getOllamaModel() {
  return process.env.OLLAMA_MODEL ?? "llama3.2";
}

export function isAssistantEnabled() {
  return process.env.ASSISTANT_ENABLED !== "false";
}

export function getAssistantMaxHistory() {
  return Math.min(20, Math.max(2, Number(process.env.ASSISTANT_MAX_HISTORY ?? 12)));
}

export function getAssistantRateLimitPerMinute() {
  return Math.max(10, Number(process.env.ASSISTANT_RATE_LIMIT ?? 30));
}
