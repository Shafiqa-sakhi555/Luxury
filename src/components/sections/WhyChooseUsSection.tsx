"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  Gem,
  Ruler,
  Wrench,
  Truck,
  Headphones,
} from "lucide-react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { whyChooseUs } from "@/lib/homeContent";

const icons = {
  calendar: Calendar,
  gem: Gem,
  ruler: Ruler,
  wrench: Wrench,
  truck: Truck,
  headphones: Headphones,
};

export function WhyChooseUsSection() {
  return (
    <section className="relative bg-white section-spacing-md">
      <div className="page-container">
        <SectionHeading
          eyebrow="The Jalals Difference"
          title="Why Choose Jalal's Home Solution?"
          description="Premium quality, personalized service, and a legacy of trust — everything your home deserves."
          align="center"
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {whyChooseUs.map((item, i) => {
            const Icon = icons[item.icon];
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                className="group rounded-2xl bg-luxury-cream p-6 shadow-sm ring-1 ring-navy/6 transition-all hover:-translate-y-1 hover:shadow-lg hover:ring-red/15 sm:p-7"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red/10 text-red ring-1 ring-red/15 transition-colors group-hover:bg-red group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-xl text-navy">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
