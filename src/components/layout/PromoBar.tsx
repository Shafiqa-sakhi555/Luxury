"use client";

import { Truck, Ruler, Shield, Store } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { promoMessagesFor, trustFeatures } from "@/lib/marketing";

const icons = { truck: Truck, ruler: Ruler, shield: Shield, store: Store };

export function PromoBar({ freeDeliveryThresholdMinor = 5_000_000 }: { freeDeliveryThresholdMinor?: number }) {
  const prefersReducedMotion = useReducedMotion();
  const promoMessages = promoMessagesFor(freeDeliveryThresholdMinor);
  const doubled = [...promoMessages, ...promoMessages];

  return (
    <div className="relative overflow-hidden border-b border-white/10 bg-red text-white">
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-white/40 via-white/20 to-white/40" />
      <div className="relative flex overflow-hidden py-2.5">
        <motion.div
          animate={prefersReducedMotion ? undefined : { x: ["0%", "-50%"] }}
          transition={prefersReducedMotion ? undefined : { duration: 28, repeat: Infinity, ease: "linear" }}
          className="promo-marquee flex shrink-0 items-center gap-10 whitespace-nowrap px-4"
        >
          {doubled.map((msg, i) => (
            <span
              key={`${msg}-${i}`}
              className="inline-flex items-center gap-2 text-[11px] font-medium tracking-wide text-white/95 sm:text-xs"
            >
              <span className="h-1 w-1 rounded-full bg-white/90" aria-hidden />
              {msg}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export function TrustFeaturesBar() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative border-b border-navy/8 bg-white py-8 sm:py-10">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
        {trustFeatures.map((feature, i) => {
          const Icon = icons[feature.icon];
          return (
            <motion.div
              key={feature.title}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={prefersReducedMotion ? undefined : { delay: i * 0.08, duration: 0.5 }}
              className="flex items-start gap-3 sm:gap-4"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red/8 text-red ring-1 ring-red/15">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-navy">{feature.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
