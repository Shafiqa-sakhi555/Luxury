"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { craftSteps } from "@/lib/data";

function CraftCard({
  step,
  index,
  scrollYProgress,
}: {
  step: (typeof craftSteps)[0];
  index: number;
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [index % 2 === 0 ? 40 : -40, index % 2 === 0 ? -40 : 40]
  );

  return (
    <motion.div
      style={{ y }}
      className="group relative mx-auto max-w-6xl overflow-hidden rounded-2xl sm:rounded-3xl"
    >
      <div className="relative aspect-[16/10] sm:aspect-[21/9] md:aspect-[21/8]">
        <Image
          src={step.image}
          alt={step.title}
          fill
          className="object-cover transition-transform duration-1000 group-hover:scale-105"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-midnight/95 via-midnight/50 to-midnight/20 sm:via-midnight/40" />

        <div className="absolute inset-0 flex flex-col justify-end p-5 sm:justify-center sm:p-10 md:p-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.8, delay: index * 0.15 }}
            className="max-w-lg"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-gold sm:text-xs">
              {step.step}
            </span>
            <h3 className="mt-2 font-display text-2xl font-light text-ivory sm:mt-3 sm:text-4xl md:text-5xl">
              {step.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ivory/65 sm:mt-4 sm:text-base md:text-lg">
              {step.subtitle}
            </p>
            <div className="mt-4 h-[1px] w-0 bg-gold transition-all duration-700 group-hover:w-20 sm:mt-6 sm:group-hover:w-24" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export function ExperiencesSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  return (
    <section id="craft" ref={containerRef} className="relative py-20 sm:py-32 md:py-48">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Craftsmanship"
          title="From Mountain to Your Home"
          description="Every carpet and sofa passes through skilled hands — rooted in Gilgit Baltistan tradition."
          align="center"
        />
      </div>

      <div className="mt-6 space-y-4 px-4 sm:mt-8 sm:px-6 lg:px-8">
        {craftSteps.map((step, i) => (
          <CraftCard
            key={step.id}
            step={step}
            index={i}
            scrollYProgress={scrollYProgress}
          />
        ))}
      </div>
    </section>
  );
}
