"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { collections } from "@/lib/data";

export function CollectionsSection() {
  return (
    <section id="collections" className="relative py-20 sm:py-32 md:py-48">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Categories"
          title="Shop by Collection"
          description="Carpets, sofas, curtains, beds, and more — everything to make your GB home beautiful."
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 px-4 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:px-8">
        {collections.map((collection, i) => (
          <motion.div
            key={collection.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-5%" }}
            transition={{ duration: 0.6, delay: i * 0.06 }}
            className={`group relative cursor-pointer overflow-hidden rounded-2xl sm:rounded-3xl ${
              i === 0 || i === 5 ? "sm:col-span-2" : ""
            }`}
          >
            <div
              className={`relative ${
                i === 0 || i === 5 ? "aspect-[16/9] sm:aspect-[21/9]" : "aspect-[4/5] sm:aspect-[4/5]"
              }`}
            >
              <Image
                src={collection.image}
                alt={collection.title}
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/35 to-midnight/10 transition-opacity group-hover:via-midnight/55" />

              <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8 md:p-10">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gold/90 sm:text-xs">
                  {collection.count}+ items
                </span>
                <h3 className="mt-2 font-display text-2xl font-light text-ivory sm:text-3xl md:text-4xl lg:text-5xl">
                  {collection.title}
                </h3>
                <p className="mt-1 text-xs text-ivory/55 sm:mt-2 sm:text-sm">{collection.subtitle}</p>

                <div className="mt-4 flex items-center gap-2 text-xs text-gold opacity-100 transition-opacity sm:mt-6 sm:text-sm sm:opacity-0 sm:group-hover:opacity-100">
                  Browse Collection
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
