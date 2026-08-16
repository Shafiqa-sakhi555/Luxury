"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { getOptimizedImageUrl } from "@/lib/cloudinary/url";

export type ShopCategoryCard = {
  slug: string;
  title: string;
  href: string;
  description?: string;
  imageUrl: string | null;
};

export function FeaturedCategoriesSection({ categories }: { categories: ShopCategoryCard[] }) {
  if (categories.length === 0) return null;

  return (
    <section id="categories" className="relative bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Collections"
          title="Shop by Category"
          description="Explore our most sought-after categories — curated for elegant, modern living."
          align="center"
        />

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i, 8) * 0.05, duration: 0.5 }}
            >
              <Link
                href={cat.href}
                className="group relative block aspect-[4/5] overflow-hidden rounded-2xl shadow-md ring-1 ring-navy/8 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:ring-red/25 sm:aspect-[3/4]"
              >
                {cat.imageUrl ? (
                  <Image
                    src={getOptimizedImageUrl(cat.imageUrl, { width: 600, height: 800, crop: "fill" })}
                    alt={cat.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-50 via-mist to-brand-100 px-4 text-center">
                    <span className="font-display text-lg text-navy/45 sm:text-xl">{cat.title}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 sm:p-5">
                  <div>
                    <h3 className="font-display text-lg text-white sm:text-xl">{cat.title}</h3>
                    {cat.description ? (
                      <p className="mt-1 line-clamp-2 text-[11px] text-white/75 sm:text-xs">
                        {cat.description}
                      </p>
                    ) : null}
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/90 opacity-0 shadow transition-all group-hover:opacity-100">
                    <ArrowUpRight className="h-4 w-4 text-red" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
