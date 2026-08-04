"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { showrooms } from "@/lib/data";

export function FeaturedDestinations() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const x = useTransform(scrollYProgress, [0, 1], ["2%", "-12%"]);

  const doubled = [...showrooms, ...showrooms];

  return (
    <section id="showrooms" ref={containerRef} className="relative overflow-hidden section-navy-band py-20 sm:py-32">
      <div className="blob-cyan right-1/4 top-0 h-96 w-96 opacity-40" />
      <div className="blob-red -left-20 bottom-0 h-72 w-72 opacity-30" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Our Showrooms"
          title="Serving Gilgit-Baltistan"
          description="Visit us across GB valleys — from Gilgit city to Hunza, Skardu, and beyond."
          light
        />
      </div>

      <div className="relative mt-6 overflow-x-auto overflow-y-hidden mask-fade-edges hide-scrollbar sm:mt-8">
        <motion.div style={{ x }} className="flex w-max gap-4 px-4 sm:gap-6 sm:px-6">
          {doubled.map((item, i) => (
            <motion.div
              key={`${item.id}-${i}`}
              whileHover={{ scale: 1.03, y: -6 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="group relative h-[360px] w-[280px] shrink-0 cursor-pointer overflow-hidden rounded-2xl shadow-xl ring-2 ring-white/20 transition-all hover:ring-cyan/50 sm:h-[480px] sm:w-[340px] sm:rounded-3xl md:h-[520px] md:w-[380px]"
            >
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 640px) 280px, 380px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent" />

              <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8">
                <p className="text-[10px] uppercase tracking-[0.2em] text-cyan sm:text-xs">
                  {item.region}
                </p>
                <h3 className="mt-2 font-display text-2xl font-light text-white sm:text-3xl md:text-4xl">
                  {item.name}
                </h3>
                <div className="mt-3 flex items-center justify-between sm:mt-4">
                  <span className="text-xs text-white/70 sm:text-sm">
                    {item.products}+ products
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 opacity-0 transition-all group-hover:opacity-100 sm:h-10 sm:w-10">
                    <ArrowUpRight className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
