"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const DEFAULT_GREETING =
  "Assalam o Alaikum! I'm Jalal Assistance — your consultant for curtains, carpets, prayer mats, branches, delivery, and design advice. How can I help you today?";

const SUGGESTIONS = [
  "What curtains do you have?",
  "Carpets for living room",
  "Branch in Hunza?",
  "Delivery to Skardu?",
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

export function AssistantChatPanel({
  className = "",
  compact = false,
  onSend,
}: AssistantChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: DEFAULT_GREETING },
  ]);
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

    try {
      let reply: string;

      if (onSend) {
        reply = await onSend(nextMessages);
      } else {
        const res = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: getSessionId(),
            messages: nextMessages,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Request failed");
        }
        reply = data.message as string;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't respond right now. Please try again or contact us at +92 313 5205272.",
        },
      ]);
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
            <p className="text-[11px] text-ivory/50">AI consultant · Gilgit-Baltistan</p>
          </div>
          <Sparkles className="ml-auto h-4 w-4 animate-pulse text-gold" />
        </div>
      </div>

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
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[92%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed sm:max-w-[85%] sm:px-4 sm:py-3 sm:text-sm ${
                  msg.role === "user" ? "bg-royal text-ivory" : "glass text-ivory/85"
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
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

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 px-4 pb-2 sm:px-5">
          {SUGGESTIONS.map((s) => (
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

      {error && (
        <p className="px-4 pb-1 text-[11px] text-red-300/80 sm:px-5">{error}</p>
      )}

      <div className="shrink-0 border-t border-glass-border p-3 sm:p-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder="Ask about products, branches, delivery…"
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
