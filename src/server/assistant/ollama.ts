import { getOllamaBaseUrl, getOllamaModel } from "./config";

export type OllamaMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OllamaChatResponse = {
  message?: { content?: string };
  error?: string;
};

type OllamaStreamChunk = {
  message?: { content?: string };
  done?: boolean;
};

export async function chatWithOllama(messages: OllamaMessage[]): Promise<string> {
  const baseUrl = getOllamaBaseUrl();
  const model = getOllamaModel();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature: 0.4,
          num_predict: 800,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Ollama error ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as OllamaChatResponse;
    const content = data.message?.content?.trim();
    if (!content) throw new Error("Ollama returned an empty response");
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

export async function* streamChatWithOllama(
  messages: OllamaMessage[]
): AsyncGenerator<string, string, undefined> {
  const baseUrl = getOllamaBaseUrl();
  const model = getOllamaModel();

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      options: {
        temperature: 0.4,
        num_predict: 800,
      },
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ollama stream error ${res.status}: ${text.slice(0, 200)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const chunk = JSON.parse(trimmed) as OllamaStreamChunk;
        const token = chunk.message?.content ?? "";
        if (token) {
          full += token;
          yield token;
        }
      } catch {
        /* skip malformed chunk */
      }
    }
  }

  return full.trim();
}

export async function isOllamaReachable() {
  try {
    const res = await fetch(`${getOllamaBaseUrl()}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
