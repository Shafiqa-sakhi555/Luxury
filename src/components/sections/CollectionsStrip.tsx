"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { collections } from "@/lib/data";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Button } from "@/components/ui/button";

export function CollectionsStrip() {
  const items = [...collections, ...collections];

  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Collections"
            title="Curated For Every Room"
            description="Explore our most-loved categories — from handmade carpets to luxury sofas."
            className="mb-0"
          />
          <Link href="/shop" className="shrink-0">
            <Button variant="outline" size="lg">
              View All Collections
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative mt-10 overflow-x-auto mask-fade-edges hide-scrollbar">
        <motion.div
          animate={{ x: [0, -1200] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="flex w-max gap-5 px-4 sm:gap-6 sm:px-6"
        >
          {items.map((item, i) => (
            <Link
              key={`${item.id}-${i}`}
              href="/shop"
              className="group relative h-[280px] w-[220px] shrink-0 overflow-hidden rounded-2xl shadow-lg ring-1 ring-navy/10 transition-all hover:-translate-y-1 hover:shadow-xl sm:h-[320px] sm:w-[260px]"
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="260px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-cyan">
                  {item.count}+ items
                </p>
                <h3 className="mt-1 font-display text-xl text-white">{item.title}</h3>
                <p className="mt-1 text-xs text-white/70">{item.subtitle}</p>
              </div>
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
