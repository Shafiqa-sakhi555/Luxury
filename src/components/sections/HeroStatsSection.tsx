"use client";

import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { heroStats } from "@/lib/homeContent";

export function HeroStatsSection() {
  return (
    <section
      aria-label="Company statistics"
      className="relative border-b border-navy/8 bg-luxury-cream py-10 sm:py-12"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5 lg:px-8">
        {heroStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            className="rounded-3xl bg-white px-4 py-5 text-center shadow-sm ring-1 ring-navy/6 sm:px-5 sm:py-6"
          >
            <p className="font-display text-2xl font-light text-navy sm:text-3xl md:text-4xl">
              <AnimatedCounter
                value={stat.value}
                suffix={stat.suffix}
                textValue={stat.textValue}
              />
            </p>
            <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted sm:text-xs">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
