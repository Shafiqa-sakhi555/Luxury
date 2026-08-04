"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { categories } from "@/lib/categories";

const cardAccents = [
  "ring-red/20 hover:ring-red/40",
  "ring-blue/20 hover:ring-blue/40",
  "ring-cyan/20 hover:ring-cyan/40",
  "ring-navy/20 hover:ring-navy/40",
];

export function CategoriesSection() {
  return (
    <section id="categories" className="relative overflow-hidden section-brand py-20 sm:py-32">
      <div className="brand-accent-bar absolute inset-x-0 top-0" />
      <div className="blob-cyan -right-16 top-10 h-64 w-64" />
      <div className="blob-red bottom-0 left-0 h-56 w-56" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Shop by Category"
          title="Everything for Your Home"
          description="Thirteen categories — from prayer mats to premium furniture — each with custom sizing and configuration options."
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {categories.map((category, i) => (
            <motion.div
              key={category.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-5%" }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
            >
              <Link
                href={`/shop?category=${category.slug}`}
                className={`group relative block overflow-hidden rounded-2xl bg-white shadow-md ring-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${cardAccents[i % cardAccents.length]}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/30 to-blue/10" />
                  {category.parent && (
                    <span className="absolute top-2 left-2 rounded-full bg-red px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
                      Furniture
                    </span>
                  )}
                </div>
                <div className="border-t border-navy/5 bg-gradient-to-b from-white to-brand-50 p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-base font-medium text-navy sm:text-lg">
                        {category.name}
                      </h3>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted sm:text-xs">
                        {category.description}
                      </p>
                    </div>
                    <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-red opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
