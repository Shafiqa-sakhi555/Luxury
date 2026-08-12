"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { founder } from "@/lib/content";

export function FounderPreviewSection() {
  return (
    <section className="relative overflow-hidden section-brand-light py-20 sm:py-32">
      <div className="brand-accent-bar absolute inset-x-0 top-0" />
      <div className="blob-blue -right-20 top-1/4 h-72 w-72 opacity-30" />
      <div className="blob-red -left-10 bottom-10 h-56 w-56 opacity-25" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
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
              <div className="absolute inset-0 bg-gradient-to-t from-navy/55 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <p className="font-display text-2xl text-white sm:text-3xl">{founder.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan/90">
                  {founder.title}
                </p>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 hidden h-24 w-24 rounded-2xl gradient-brand shadow-lg sm:block" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <SectionHeading
              eyebrow="From the Founder"
              title="A Legacy Built on Integrity"
              className="mb-0"
            />

            <div className="relative mt-8 overflow-hidden rounded-2xl border border-blue/15 bg-white p-6 shadow-lg shadow-navy/5 sm:p-8">
              <Quote className="absolute -top-2 right-6 h-9 w-9 text-red/25" />
              <p className="font-display text-xl italic leading-relaxed text-red/90 sm:text-2xl">
                &ldquo;{founder.quote}&rdquo;
              </p>
              <div className="mt-5 border-t border-navy/8 pt-4">
                <p className="text-sm font-medium text-navy">{founder.name}</p>
                <p className="text-xs text-muted">{founder.company}</p>
              </div>
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
