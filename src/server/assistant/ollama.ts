import { getOllamaBaseUrl, getOllamaModel } from "./config";

export type OllamaMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OllamaChatResponse = {
  message?: { content?: string };
  error?: string;
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
