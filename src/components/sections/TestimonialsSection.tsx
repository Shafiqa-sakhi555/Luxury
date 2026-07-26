"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { testimonials } from "@/lib/data";

export function TestimonialsSection() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((c) => (c + 1) % testimonials.length);
  const prev = () =>
    setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="relative overflow-hidden py-20 sm:py-32 md:py-48">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-royal/[0.05] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Reviews"
          title="What Our Customers Say"
          description="Real feedback from families and businesses across Gilgit Baltistan."
          align="center"
        />

        <div className="relative mx-auto mt-6 max-w-4xl sm:mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.97 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong rounded-2xl p-6 sm:rounded-3xl sm:p-10 md:p-12"
            >
              <Quote className="h-7 w-7 text-gold/50 sm:h-8 sm:w-8" />

              <p className="mt-4 font-display text-lg font-light leading-relaxed text-ivory sm:mt-6 sm:text-xl md:text-2xl lg:text-3xl">
                &ldquo;{testimonials[current].quote}&rdquo;
              </p>

              <div className="mt-6 flex flex-col gap-4 sm:mt-8 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full sm:h-14 sm:w-14">
                    <Image
                      src={testimonials[current].image}
                      alt={testimonials[current].name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-ivory">{testimonials[current].name}</p>
                    <p className="text-sm text-ivory/50">{testimonials[current].role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 sm:ml-auto">
                  {Array.from({ length: testimonials[current].rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-center gap-3 sm:mt-8 sm:gap-4">
            <button
              onClick={prev}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-glass-border text-ivory/60 transition-all hover:border-gold/40 hover:text-ivory sm:h-12 sm:w-12"
              aria-label="Previous review"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === current ? "w-8 bg-gold" : "w-1.5 bg-ivory/20"
                  }`}
                  aria-label={`Go to review ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-glass-border text-ivory/60 transition-all hover:border-gold/40 hover:text-ivory sm:h-12 sm:w-12"
              aria-label="Next review"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
