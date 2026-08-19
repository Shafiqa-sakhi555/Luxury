"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Bot, MessageCircle, Package, Palette, Sparkles, Store } from "lucide-react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { PageContainer } from "@/components/ui/page-container";
import { OpenAssistantButton } from "@/components/assistant/OpenAssistantButton";
import { images } from "@/lib/data";

const capabilities = [
  {
    icon: Palette,
    title: "Design consultation",
    description: "Room-by-room guidance with live product recommendations from our catalog.",
  },
  {
    icon: Package,
    title: "Orders & cart",
    description: "Check order status, cart totals, and delivery — signed-in customers get account-aware answers.",
  },
  {
    icon: Store,
    title: "Showrooms & support",
    description: "Branch locations, hours, policies, and human handoff when you need a specialist.",
  },
];

const quickPrompts = [
  "Help me design my living room",
  "Show me curtain options",
  "Where is my nearest showroom?",
];

export function JalalAssistanceSection() {
  return (
    <section
      id="jalal-assistance"
      aria-label="Jalal Assistance design consultant"
      className="relative overflow-hidden section-navy-band section-spacing-md"
    >
      <div className="blob-cyan right-0 top-0 h-80 w-80 opacity-30" />
      <div className="blob-red -left-16 bottom-0 h-64 w-64 opacity-25" />

      <PageContainer className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Jalal Assistance"
              title="Your Personal Design Consultant"
              description="Get tailored recommendations for curtains, carpets, and prayer mats — powered by live catalog data, not generic chatbot replies."
              light
              className="mb-0"
            />

            <ul className="mt-8 space-y-4">
              {capabilities.map(({ icon: Icon, title, description }, i) => (
                <motion.li
                  key={title}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className="flex gap-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                    <Icon className="h-4 w-4 text-cyan" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/60">{description}</p>
                  </div>
                </motion.li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <OpenAssistantButton
                variant="default"
                size="lg"
                prompt="I'd like a free design consultation for my home"
                className="min-w-[220px] shadow-lg shadow-red/25"
              >
                <MessageCircle className="h-4 w-4" />
                Start free consultation
              </OpenAssistantButton>
              <OpenAssistantButton variant="outline" size="lg" className="min-w-[200px] border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white">
                Open assistant
              </OpenAssistantButton>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <OpenAssistantButton
                  key={prompt}
                  prompt={prompt}
                  variant="ghost"
                  size="sm"
                  className="rounded-full border border-white/15 bg-white/5 text-xs text-white/75 hover:bg-white/10 hover:text-white"
                >
                  {prompt}
                </OpenAssistantButton>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-surface-card shadow-2xl shadow-black/30"
          >
            <div className="relative h-36 overflow-hidden sm:h-44">
              <Image
                src={images.sections.advisor}
                alt="Interior design consultation"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-surface-dark/90 via-surface-dark/50 to-transparent" />
              <div className="absolute inset-0 flex items-end p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet/30 ring-1 ring-white/15">
                    <Bot className="h-5 w-5 text-violet" />
                  </div>
                  <div>
                    <p className="font-medium text-text-on-dark">Jalal Assistance</p>
                    <p className="text-xs text-text-on-dark/60">Live catalog · design · support</p>
                  </div>
                  <Sparkles className="ml-auto h-4 w-4 text-accent" />
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6 sm:p-8">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm leading-relaxed text-text-on-dark/85">
                  &ldquo;Tell me about your room — style, colours, and budget — and I&apos;ll recommend
                  curtains, carpets, or prayer mats from our live catalog with real prices.&rdquo;
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-accent/10 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-accent">
                  Example flow
                </p>
                <p className="mt-2 text-sm text-text-on-dark/80">
                  Living room → modern style → light colours → curated product cards with links
                </p>
              </div>
              <OpenAssistantButton
                prompt="Help me design my living room"
                className="w-full"
                size="lg"
              >
                Try it now
              </OpenAssistantButton>
            </div>
          </motion.div>
        </div>
      </PageContainer>
    </section>
  );
}
