"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, LogIn, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ConsultationRecommendation = {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: string;
  url: string;
  shortDescription: string | null;
  reason?: string;
};

type AssistantApiResponse = {
  message: string;
  requiresLogin?: boolean;
  handoffCreated?: boolean;
  consultation?: {
    mode: "gather_info" | "recommend" | "not_consultation";
    profileSummary?: string;
    nextQuestion?: string;
    recommendations?: ConsultationRecommendation[];
    suggestedReplies?: string[];
  };
};

type RichMessage = ChatMessage & {
  recommendations?: ConsultationRecommendation[];
  streaming?: boolean;
};

const DEFAULT_GREETING =
  "Assalam o Alaikum! I'm Jalal Assistance — your design consultant for curtains, carpets, and prayer mats. I can help with product recommendations, orders (when logged in), cart, branches, and delivery.";

const SUGGESTIONS = [
  "Help me design my living room",
  "What's in my cart?",
  "Where is my order?",
  "Speak to someone",
];

type AssistantChatPanelProps = {
  className?: string;
  compact?: boolean;
  onSend?: (messages: ChatMessage[]) => Promise<string>;
};

function getSessionId() {
  if (typeof window === "undefined") return "server";
  const key = "jalal-assistant-session";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

async function consumeAssistantStream(
  messages: ChatMessage[],
  onMeta: (data: Partial<AssistantApiResponse>) => void,
  onToken: (token: string) => void
): Promise<AssistantApiResponse> {
  const res = await fetch("/api/assistant/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: getSessionId(),
      messages,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Request failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalResult: AssistantApiResponse = { message: "" };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const lines = block.split("\n");
      const eventLine = lines.find((l) => l.startsWith("event:"));
      const dataLine = lines.find((l) => l.startsWith("data:"));
      if (!eventLine || !dataLine) continue;

      const event = eventLine.replace("event:", "").trim();
      const payload = JSON.parse(dataLine.replace("data:", "").trim());

      if (event === "meta") onMeta(payload);
      if (event === "token") onToken(payload.text ?? "");
      if (event === "done") finalResult = payload as AssistantApiResponse;
      if (event === "error") throw new Error(payload.error ?? "Stream error");
    }
  }

  return finalResult;
}

export function AssistantChatPanel({
  className = "",
  compact = false,
  onSend,
}: AssistantChatPanelProps) {
  const [messages, setMessages] = useState<RichMessage[]>([
    { role: "assistant", content: DEFAULT_GREETING },
  ]);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>(SUGGESTIONS);
  const [consultationMode, setConsultationMode] = useState<string | null>(null);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setIsTyping(true);
    setError(null);
    setRequiresLogin(false);

    try {
      if (onSend) {
        const reply = await onSend(nextMessages);
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        return;
      }

      const assistantIndex = nextMessages.length;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", streaming: true },
      ]);

      let streamed = "";

      const data = await consumeAssistantStream(
        nextMessages,
        (meta) => {
          setConsultationMode(meta.consultation?.mode ?? null);
          setRequiresLogin(Boolean(meta.requiresLogin));
          if (meta.consultation?.suggestedReplies?.length) {
            setSuggestedReplies(meta.consultation.suggestedReplies);
          }
        },
        (token) => {
          streamed += token;
          setMessages((prev) => {
            const copy = [...prev];
            copy[assistantIndex] = {
              role: "assistant",
              content: streamed,
              streaming: true,
            };
            return copy;
          });
        }
      );

      setConsultationMode(data.consultation?.mode ?? null);
      setRequiresLogin(Boolean(data.requiresLogin));
      if (data.consultation?.suggestedReplies?.length) {
        setSuggestedReplies(data.consultation.suggestedReplies);
      }

      setMessages((prev) => {
        const copy = [...prev];
        copy[assistantIndex] = {
          role: "assistant",
          content: data.message || streamed,
          recommendations: data.consultation?.recommendations,
          streaming: false,
        };
        return copy;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      setMessages((prev) => {
        const withoutEmpty = prev.filter((m) => !(m.streaming && !m.content));
        return [
          ...withoutEmpty,
          {
            role: "assistant",
            content:
              "Sorry, I couldn't respond right now. Please try again or contact us at +92 313 5205272.",
          },
        ];
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={`flex flex-col overflow-hidden ${className}`}>
      <div className="relative shrink-0 overflow-hidden border-b border-glass-border bg-midnight/40 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet/30 backdrop-blur-sm">
            <Bot className="h-4 w-4 text-violet" />
          </div>
          <div>
            <p className="text-sm font-medium text-ivory">Jalal Assistance</p>
            <p className="text-[11px] text-ivory/50">
              {consultationMode === "gather_info"
                ? "Design consultation · gathering preferences"
                : consultationMode === "recommend"
                  ? "Design consultation · recommendations"
                  : "AI consultant · orders · design · support"}
            </p>
          </div>
          <Sparkles className="ml-auto h-4 w-4 animate-pulse text-gold" />
        </div>
      </div>

      {requiresLogin && (
        <div className="flex items-center gap-2 border-b border-glass-border bg-royal/20 px-4 py-2 text-[11px] text-ivory/80 sm:px-5 sm:text-xs">
          <LogIn className="h-3.5 w-3.5 shrink-0" />
          <span>
            Log in to view orders —{" "}
            <Link href="/login" className="text-gold underline underline-offset-2">
              Sign in
            </Link>
          </span>
        </div>
      )}

      <div
        ref={scrollRef}
        className={`flex flex-1 flex-col gap-3 overflow-y-auto p-4 hide-scrollbar sm:gap-4 sm:p-5 ${
          compact ? "min-h-[240px] max-h-[320px]" : "min-h-[280px] max-h-[380px] sm:max-h-[420px]"
        }`}
      >
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[92%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed sm:max-w-[85%] sm:px-4 sm:py-3 sm:text-sm ${
                  msg.role === "user" ? "bg-royal text-ivory" : "glass text-ivory/85"
                }`}
              >
                {msg.content}
                {msg.streaming && (
                  <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-violet/70" />
                )}
              </div>

              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="flex w-full max-w-[92%] flex-col gap-2 sm:max-w-[85%]">
                  {msg.recommendations.map((product) => (
                    <Link
                      key={product.id}
                      href={product.url}
                      className="glass block rounded-xl border border-glass-border p-3 transition-colors hover:border-violet/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-medium text-ivory sm:text-sm">{product.name}</p>
                          <p className="mt-0.5 text-[11px] text-ivory/50">{product.category}</p>
                        </div>
                        <span className="shrink-0 text-xs font-medium text-gold">{product.price}</span>
                      </div>
                      {product.shortDescription && (
                        <p className="mt-2 line-clamp-2 text-[11px] text-ivory/65">
                          {product.shortDescription}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && messages[messages.length - 1]?.streaming !== true && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1 px-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                className="h-2 w-2 rounded-full bg-violet/60"
              />
            ))}
          </motion.div>
        )}
      </div>

      {suggestedReplies.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-2 sm:px-5">
          {suggestedReplies.slice(0, 4).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => sendMessage(s)}
              disabled={isTyping}
              className="glass rounded-full px-3 py-1.5 text-[11px] text-ivory/65 transition-all hover:border-violet/30 hover:text-ivory sm:text-xs"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && <p className="px-4 pb-1 text-[11px] text-red-300/80 sm:px-5">{error}</p>}

      <div className="shrink-0 border-t border-glass-border p-3 sm:p-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder="Design advice, products, orders, cart…"
            disabled={isTyping}
            className="flex-1 rounded-xl bg-glass px-3 py-2.5 text-xs text-ivory placeholder:text-ivory/30 outline-none disabled:opacity-60 sm:px-4 sm:py-3 sm:text-sm"
          />
          <Button
            variant="gold"
            size="icon"
            onClick={() => sendMessage(input)}
            disabled={isTyping || !input.trim()}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
