"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Bot } from "lucide-react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Button } from "@/components/ui/button";
import { images } from "@/lib/data";

const suggestions = [
  "Best carpet for living room",
  "Sofa set under Rs. 150,000",
  "Custom carpet size 8×10",
  "Delivery to Hunza?",
];

const demoResponses: Record<string, string> = {
  default:
    "Assalam o Alaikum! I'm your Lexury home advisor. Ask me about carpets, sofas, curtains, sizes, prices, or delivery anywhere in Gilgit Baltistan.",
  carpet:
    "For living rooms in GB, I recommend our Hunza Heritage Carpet (8×10 ft, Rs. 85,000) — warm wool, perfect for cold winters. We also have silk Kashan from Rs. 60,000.",
  sofa:
    "Our Royal Velvet 3+2+1 set is Rs. 145,000 — very popular in Skardu guest houses. For budget-friendly, the Comfort Lounge Chair is Rs. 35,000 with ottoman.",
  custom:
    "Yes! We make custom carpets in any size. Share your room dimensions and preferred colors — our artisans in Gilgit can deliver in 2–3 weeks.",
  delivery:
    "Free delivery in Gilgit city! Hunza, Skardu, Ghizer, and Astore delivery takes 3–5 days. We pack everything carefully for mountain roads.",
};

const previewProducts = [
  { src: images.products.heritageCarpet, label: "Carpets" },
  { src: images.products.velvetSofa, label: "Sofas" },
  { src: images.products.velvetCurtains, label: "Curtains" },
];

type Message = { role: "assistant" | "user"; content: string };

export function AIConciergeSection() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: demoResponses.default },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const lower = text.toLowerCase();
      let response = demoResponses.default;
      if (lower.includes("carpet") || lower.includes("living")) response = demoResponses.carpet;
      else if (lower.includes("sofa") || lower.includes("150")) response = demoResponses.sofa;
      else if (lower.includes("custom") || lower.includes("size")) response = demoResponses.custom;
      else if (lower.includes("delivery") || lower.includes("hunza")) response = demoResponses.delivery;

      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <section className="relative py-20 sm:py-32 md:py-48">
      <div className="absolute inset-0 bg-gradient-to-b from-violet/[0.05] via-transparent to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Home Advisor"
              title="Need Help Choosing?"
              description="Ask our smart assistant about products, sizes, prices, and delivery across Gilgit Baltistan — available 24/7."
              className="mb-0 sm:mb-0"
            />

            <div className="mt-6 grid grid-cols-3 gap-2 sm:mt-8 sm:gap-3">
              {previewProducts.map((item) => (
                <div key={item.label} className="group relative aspect-square overflow-hidden rounded-xl">
                  <Image
                    src={item.src}
                    alt={item.label}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="120px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 to-transparent" />
                  <span className="absolute bottom-2 left-2 text-[10px] font-medium uppercase tracking-wider text-gold sm:text-xs">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="glass rounded-full px-3 py-1.5 text-[11px] text-ivory/65 transition-all hover:border-violet/30 hover:text-ivory sm:px-4 sm:py-2 sm:text-xs"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="glass-strong overflow-hidden rounded-2xl sm:rounded-3xl"
          >
            <div className="relative h-24 overflow-hidden sm:h-28">
              <Image
                src={images.sections.advisor}
                alt="Home furnishing inspiration"
                fill
                className="object-cover"
                sizes="600px"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-midnight/80 to-midnight/40" />
              <div className="absolute inset-0 flex items-center gap-3 px-4 sm:px-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet/30 backdrop-blur-sm sm:h-10 sm:w-10">
                  <Bot className="h-4 w-4 text-violet sm:h-5 sm:w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ivory">Lexury Home Advisor</p>
                  <p className="text-[11px] text-ivory/50 sm:text-xs">Online · Gilgit Baltistan</p>
                </div>
                <Sparkles className="ml-auto h-4 w-4 animate-pulse text-gold" />
              </div>
            </div>

            <div className="flex h-[280px] flex-col gap-3 overflow-y-auto p-4 hide-scrollbar sm:h-[340px] sm:gap-4 sm:p-6">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed sm:max-w-[85%] sm:px-4 sm:py-3 sm:text-sm ${
                        msg.role === "user" ? "bg-royal text-ivory" : "glass text-ivory/85"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1 px-3">
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

            <div className="border-t border-glass-border p-3 sm:p-4">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                  placeholder="Ask about carpets, sofas, delivery..."
                  className="flex-1 rounded-xl bg-glass px-3 py-2.5 text-xs text-ivory placeholder:text-ivory/30 outline-none sm:px-4 sm:py-3 sm:text-sm"
                />
                <Button variant="gold" size="icon" onClick={() => sendMessage(input)} className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
