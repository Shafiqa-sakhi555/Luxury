"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Check, Crown } from "lucide-react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Button } from "@/components/ui/button";
import { membershipPlans, formatPrice, images } from "@/lib/data";
import { cn } from "@/lib/utils";

export function MembershipSection() {
  return (
    <section id="membership" className="relative overflow-hidden py-20 sm:py-32 md:py-48">
      <div className="absolute inset-0">
        <Image
          src={images.sections.membership}
          alt="Elegant home interior with furniture"
          fill
          className="object-cover opacity-20"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-midnight via-midnight/95 to-midnight" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Membership Plans"
          title="Save More on Every Purchase"
          description="Join Jalals Home Solution membership for exclusive discounts, priority customization, and premium delivery services."
          align="center"
        />

        <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-6 md:grid-cols-3">
          {membershipPlans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              whileHover={{ y: -6 }}
              className={cn(
                "relative rounded-2xl p-6 transition-all duration-500 sm:rounded-3xl sm:p-8",
                plan.highlighted
                  ? "gradient-gold text-midnight shadow-2xl shadow-gold/15 ring-2 ring-gold/30"
                  : "glass-strong"
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-midnight px-3 py-1 text-[10px] text-gold sm:px-4 sm:text-xs">
                  <Crown className="h-3 w-3" />
                  Best Value
                </div>
              )}

              <h3
                className={cn(
                  "font-display text-xl font-light sm:text-2xl",
                  plan.highlighted ? "text-midnight" : "text-ivory"
                )}
              >
                {plan.name}
              </h3>

              <div className="mt-4 flex items-baseline gap-1 sm:mt-6">
                <span
                  className={cn(
                    "font-display text-3xl font-light sm:text-4xl md:text-5xl",
                    plan.highlighted ? "text-midnight" : "text-ivory"
                  )}
                >
                  {plan.price === 0 ? "Free" : formatPrice(plan.price)}
                </span>
                {plan.price > 0 && (
                  <span
                    className={cn(
                      "text-xs sm:text-sm",
                      plan.highlighted ? "text-midnight/60" : "text-ivory/40"
                    )}
                  >
                    /{plan.period}
                  </span>
                )}
              </div>

              <ul className="mt-6 space-y-3 sm:mt-8 sm:space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 sm:gap-3">
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        plan.highlighted ? "text-midnight" : "text-gold"
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs sm:text-sm",
                        plan.highlighted ? "text-midnight/80" : "text-ivory/60"
                      )}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlighted ? "default" : "outline"}
                className={cn(
                  "mt-6 w-full sm:mt-8",
                  plan.highlighted && "bg-midnight text-ivory hover:bg-midnight/90"
                )}
              >
                {plan.price === 0 ? "Get Started" : "Join Now"}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
