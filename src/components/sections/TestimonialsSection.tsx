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
    <section className="relative overflow-hidden section-brand-alt section-spacing-lg">
      <div className="brand-accent-bar absolute inset-x-0 top-0" />
      <div className="blob-red right-0 top-1/4 h-64 w-64" />
      <div className="blob-blue -left-16 bottom-0 h-72 w-72" />

      <div className="relative page-container">
        <SectionHeading
          eyebrow="Reviews"
          title="What Our Customers Say"
          description="Real feedback from families and businesses across Gilgit-Baltistan."
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
              className="card-brand overflow-hidden border-l-4 border-l-red p-6 sm:rounded-3xl sm:p-10 md:p-12"
            >
              <Quote className="h-7 w-7 text-red/50 sm:h-8 sm:w-8" />

              <p className="mt-4 font-display text-lg font-light leading-relaxed text-navy sm:mt-6 sm:text-xl md:text-2xl lg:text-3xl">
                &ldquo;{testimonials[current].quote}&rdquo;
              </p>

              <div className="mt-6 flex flex-col gap-4 sm:mt-8 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-blue/30 sm:h-14 sm:w-14">
                    <Image
                      src={testimonials[current].image}
                      alt={testimonials[current].name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-navy">{testimonials[current].name}</p>
                    <p className="text-sm text-muted">{testimonials[current].role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 sm:ml-auto">
                  {Array.from({ length: testimonials[current].rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-red text-red" />
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-center gap-3 sm:mt-8 sm:gap-4">
            <button
              onClick={prev}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-blue/20 bg-white text-navy/70 shadow-sm transition-all hover:border-red/40 hover:bg-red/5 hover:text-red sm:h-12 sm:w-12"
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
                    i === current ? "w-8 bg-gradient-to-r from-red to-blue" : "w-1.5 bg-navy/20"
                  }`}
                  aria-label={`Go to review ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-blue/20 bg-white text-navy/70 shadow-sm transition-all hover:border-red/40 hover:bg-red/5 hover:text-red sm:h-12 sm:w-12"
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
