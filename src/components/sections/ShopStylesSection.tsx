"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { shopStyles } from "@/lib/marketing";
import { SectionHeading } from "@/components/shared/SectionHeading";

export function ShopStylesSection() {
  return (
    <section className="relative section-brand-light section-spacing-md">
      <div className="page-container">
        <SectionHeading
          eyebrow="More To Explore"
          title="Your Imagination, Our Craftsmanship"
          description="Shop by style — the same breadth you'd expect from leading stores, with Jalals quality and local service."
          align="center"
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
          {shopStyles.map((style, i) => (
            <motion.div
              key={style.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
            >
              <Link
                href={style.href}
                className="group block overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-navy/8 transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-red/25"
              >
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={style.image}
                    alt={style.title}
                    fill
                    className="object-cover transition-transform duration-600 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 16vw"
                  />
                  <div className="absolute inset-0 bg-navy/0 transition-colors duration-300 group-hover:bg-navy/15" />
                  <div className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 opacity-0 shadow transition-opacity group-hover:opacity-100">
                    <ArrowUpRight className="h-3.5 w-3.5 text-red" />
                  </div>
                </div>
                <div className="p-3 text-center sm:p-4">
                  <h3 className="text-xs font-semibold text-navy sm:text-sm">{style.title}</h3>
                  <p className="mt-0.5 text-[10px] text-muted sm:text-[11px]">{style.subtitle}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
