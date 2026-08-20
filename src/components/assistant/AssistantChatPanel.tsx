"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, LogIn, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssistantRecommendationCard } from "@/components/assistant/AssistantRecommendationCard";
import type { AssistantProductRecommendation } from "@/types/assistant";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type AssistantApiResponse = {
  message: string;
  requiresLogin?: boolean;
  handoffCreated?: boolean;
  consultation?: {
    mode: "gather_info" | "recommend" | "not_consultation";
    profileSummary?: string;
    nextQuestion?: string;
    recommendations?: AssistantProductRecommendation[];
    suggestedReplies?: string[];
  };
};

type RichMessage = ChatMessage & {
  recommendations?: AssistantProductRecommendation[];
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
  titleId?: string;
  pendingPrompt?: string | null;
  onPendingPromptConsumed?: () => void;
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
  titleId = "assistant-title",
  pendingPrompt = null,
  onPendingPromptConsumed,
  onSend,
}: AssistantChatPanelProps) {
  const [messages, setMessages] = useState<RichMessage[]>([
    { role: "assistant", content: DEFAULT_GREETING },
  ]);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>(SUGGESTIONS);
  const [consultationMode, setConsultationMode] = useState<string | null>(null);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [handoffCreated, setHandoffCreated] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingHandledRef = useRef<string | null>(null);
  const messagesRef = useRef<RichMessage[]>(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const nextMessages: ChatMessage[] = [
      ...messagesRef.current,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    setIsTyping(true);
    setError(null);
    setRequiresLogin(false);
    setHandoffCreated(false);

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
          if (meta.handoffCreated) setHandoffCreated(true);
          if (meta.consultation?.suggestedReplies?.length) {
            setSuggestedReplies(meta.consultation.suggestedReplies);
          }
          if (meta.consultation?.recommendations?.length) {
            setMessages((prev) => {
              const copy = [...prev];
              if (copy[assistantIndex]) {
                copy[assistantIndex] = {
                  ...copy[assistantIndex],
                  recommendations: meta.consultation?.recommendations,
                };
              }
              return copy;
            });
          }
        },
        (token) => {
          streamed += token;
          setMessages((prev) => {
            const copy = [...prev];
            copy[assistantIndex] = {
              ...copy[assistantIndex],
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
      if (data.handoffCreated) setHandoffCreated(true);
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
  }, [isTyping, onSend]);

  useEffect(() => {
    if (!pendingPrompt) {
      pendingHandledRef.current = null;
      return;
    }
    if (isTyping) return;
    if (pendingHandledRef.current === pendingPrompt) return;

    pendingHandledRef.current = pendingPrompt;
    void sendMessage(pendingPrompt);
    onPendingPromptConsumed?.();
  }, [pendingPrompt, isTyping, onPendingPromptConsumed, sendMessage]);

  return (
    <div className={`assistant-shell flex flex-col overflow-hidden ${className}`}>
      <div className="assistant-header relative shrink-0 px-4 py-3.5 sm:px-5">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-red to-transparent" />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red/20 ring-1 ring-red/30">
            <Bot className="h-4 w-4 text-red" />
          </div>
          <div>
            <p id={titleId} className="font-display text-base font-medium text-white">
              Jalal Assistance
            </p>
            <p className="text-[11px] text-white/55">
              {consultationMode === "gather_info"
                ? "Design consultation · gathering preferences"
                : consultationMode === "recommend"
                  ? "Design consultation · recommendations"
                  : "Design · products · orders · support"}
            </p>
          </div>
          <span className="ml-auto rounded-full bg-emerald/15 px-2 py-0.5 text-[10px] font-medium text-emerald">
            Online
          </span>
        </div>
      </div>

      {handoffCreated && (
        <div className="flex items-start gap-2 border-b border-white/10 bg-emerald/10 px-4 py-2.5 text-[11px] text-white/90 sm:px-5 sm:text-xs">
          <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
          <span>
            A team member will follow up on your request. Call{" "}
            <a href="tel:+923135205272" className="font-medium text-cyan underline underline-offset-2">
              +92 313 5205272
            </a>{" "}
            or email{" "}
            <a href="mailto:info@jalalshome.pk" className="font-medium text-cyan underline underline-offset-2">
              info@jalalshome.pk
            </a>
            .
          </span>
        </div>
      )}

      {requiresLogin && (
        <div className="flex items-center gap-2 border-b border-white/10 bg-red/10 px-4 py-2 text-[11px] text-white/85 sm:px-5 sm:text-xs">
          <LogIn className="h-3.5 w-3.5 shrink-0 text-red" />
          <span>
            Log in to view orders —{" "}
            <Link href="/login" className="font-medium text-cyan underline underline-offset-2">
              Sign in
            </Link>
          </span>
        </div>
      )}

      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-busy={isTyping}
        aria-label="Chat messages"
        className={`flex flex-1 flex-col gap-3 overflow-y-auto bg-surface-dark p-4 hide-scrollbar sm:gap-4 sm:p-5 ${
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
                  msg.role === "user" ? "assistant-bubble-user" : "assistant-bubble-bot"
                }`}
              >
                {msg.content}
                {msg.streaming && (
                  <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-cyan/70" />
                )}
              </div>

              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="flex w-full max-w-[92%] flex-col gap-2 sm:max-w-[85%]">
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                    Recommended for you
                  </p>
                  {msg.recommendations.map((product) => (
                    <AssistantRecommendationCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && messages[messages.length - 1]?.streaming !== true && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-1 px-1"
            aria-hidden
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                className="h-2 w-2 rounded-full bg-red/60"
              />
            ))}
          </motion.div>
        )}
        <span className="sr-only" aria-live="polite">
          {isTyping ? "Jalal Assistance is typing" : ""}
        </span>
      </div>

      {suggestedReplies.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-white/8 bg-surface-dark/95 px-4 py-2.5 sm:px-5">
          {suggestedReplies.slice(0, 4).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => sendMessage(s)}
              disabled={isTyping}
              className="assistant-chip px-3 py-1.5 text-[11px] sm:text-xs"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="bg-surface-dark px-4 pb-1 text-[11px] text-red-300 sm:px-5">{error}</p>
      )}

      <div className="shrink-0 border-t border-white/10 bg-surface-elevated/80 p-3 sm:p-4">
        <div className="flex gap-2">
          <label htmlFor="assistant-message-input" className="sr-only">
            Message Jalal Assistance
          </label>
          <input
            id="assistant-message-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder="Design advice, products, orders, cart…"
            disabled={isTyping}
            className="assistant-input flex-1 px-3 py-2.5 text-xs disabled:opacity-60 sm:px-4 sm:py-3 sm:text-sm"
          />
          <Button
            variant="default"
            size="icon"
            onClick={() => sendMessage(input)}
            disabled={isTyping || !input.trim()}
            aria-label="Send message"
            className="shrink-0 shadow-md shadow-red/25"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Re-export for consumers that imported from this module
export type { AssistantProductRecommendation as ConsultationRecommendation };
