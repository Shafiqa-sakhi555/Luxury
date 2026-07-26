"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, Clock } from "lucide-react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { journalPosts } from "@/lib/data";

export function JournalSection() {
  return (
    <section id="journal" className="relative py-20 sm:py-32 md:py-48">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/[0.03] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Blog"
          title="Tips & Inspiration"
          description="Care guides, home decor ideas, and stories from Gilgit Baltistan's furniture heritage."
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {journalPosts.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl sm:rounded-2xl">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
                <span className="absolute top-3 left-3 rounded-full glass px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] text-gold sm:top-4 sm:left-4 sm:px-3 sm:text-[10px]">
                  {post.category}
                </span>
              </div>

              <div className="mt-4 sm:mt-6">
                <div className="flex items-center gap-2 text-[11px] text-ivory/40 sm:gap-3 sm:text-xs">
                  <span>{post.date}</span>
                  <span className="h-1 w-1 rounded-full bg-ivory/20" />
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.readTime}
                  </span>
                </div>

                <h3 className="mt-2 font-display text-lg font-light leading-snug text-ivory transition-colors group-hover:text-gold sm:mt-3 sm:text-xl md:text-2xl">
                  {post.title}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-ivory/50 line-clamp-2 sm:mt-3 sm:text-sm">
                  {post.excerpt}
                </p>

                <div className="mt-3 flex items-center gap-1 text-xs text-gold sm:mt-4 sm:text-sm">
                  Read More
                  <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
