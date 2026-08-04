"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { founder } from "@/lib/content";

export function FounderPreviewSection() {
  return (
    <section className="relative overflow-hidden section-brand py-20 sm:py-32">
      <div className="brand-accent-bar absolute inset-x-0 top-0" />
      <div className="blob-blue -right-20 top-1/4 h-80 w-80" />
      <div className="blob-red -left-10 bottom-10 h-56 w-56" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative mx-auto w-full max-w-md lg:max-w-none"
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-3xl shadow-xl ring-1 ring-navy/10">
              <Image
                src={founder.image}
                alt={`${founder.name}, Founder of Jalals Home Solution`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/40 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <p className="font-display text-2xl text-white sm:text-3xl">
                  {founder.name}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/80">
                  {founder.title}
                </p>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 hidden h-24 w-24 rounded-2xl gradient-brand sm:block" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-red sm:text-xs">
              From the Founder
            </span>
            <h2 className="mt-3 font-display text-3xl font-light leading-tight text-navy sm:text-4xl md:text-5xl">
              A Legacy Built on Integrity
            </h2>

            <div className="relative mt-8 overflow-hidden rounded-2xl border border-blue/15 bg-gradient-to-br from-white to-brand-50 p-6 shadow-lg shadow-blue/10 sm:p-8">
              <Quote className="absolute -top-3 left-6 h-8 w-8 text-red/30" />
              <p className="font-display text-xl italic leading-relaxed text-navy/90 sm:text-2xl">
                &ldquo;{founder.quote}&rdquo;
              </p>
              <p className="mt-4 text-sm font-medium text-navy">{founder.name}</p>
              <p className="text-xs text-muted">{founder.company}</p>
            </div>

            <p className="mt-6 text-sm leading-relaxed text-muted sm:text-base">
              {founder.shortBio}
            </p>

            <Link href="/about" className="mt-8 inline-block">
              <Button variant="default" size="lg">
                Read Our Story
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
