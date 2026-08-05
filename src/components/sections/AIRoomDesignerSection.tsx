"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Scan } from "lucide-react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Button } from "@/components/ui/button";
import { aiDesignerContent } from "@/lib/homeContent";

export function AIRoomDesignerSection() {
  const { id, eyebrow, title, description, cta, image } = aiDesignerContent;

  return (
    <section id={id} className="relative overflow-hidden section-brand-light py-16 sm:py-24">
      <div className="blob-blue right-0 top-0 h-80 w-80 opacity-40" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <SectionHeading
              eyebrow={eyebrow}
              title={title}
              description={description}
              className="mb-0"
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="default" size="lg" className="shadow-lg shadow-red/20">
                <Link href={cta.href}>
                  <Sparkles className="h-4 w-4" />
                  {cta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <ul className="mt-8 space-y-3 text-sm text-muted">
              <li className="flex items-center gap-2">
                <Scan className="h-4 w-4 shrink-0 text-red" />
                Upload your room photo in seconds
              </li>
              <li className="flex items-center gap-2">
                <Scan className="h-4 w-4 shrink-0 text-red" />
                Preview carpets, rugs, furniture & curtains instantly
              </li>
              <li className="flex items-center gap-2">
                <Scan className="h-4 w-4 shrink-0 text-red" />
                Share designs with our showroom experts
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl ring-1 ring-navy/10"
          >
            <Image
              src={image}
              alt="AI room designer preview — visualize carpets and furniture in your space"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-navy/50 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur-sm sm:bottom-6 sm:left-6 sm:right-6 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red">
                AI Preview
              </p>
              <p className="mt-1 font-display text-lg text-navy sm:text-xl">
                See how it looks in your room
              </p>
              <p className="mt-1 text-xs text-muted">
                Drag & drop products onto your space — coming soon to all showrooms.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
