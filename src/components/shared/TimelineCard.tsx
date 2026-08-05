"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { TimelineEntry } from "@/lib/timeline";
import { cn } from "@/lib/utils";

type TimelineCardProps = {
  item: TimelineEntry;
  index: number;
  align?: "left" | "right";
};

function TimelinePhotoBanner({ src, alt }: { src: string; alt: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.02 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-5%" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="group relative aspect-[16/9] w-full overflow-hidden sm:aspect-[2/1]"
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        sizes="(max-width: 768px) 100vw, 540px"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy/25 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 brand-accent-bar h-[3px]" />
    </motion.div>
  );
}

function TimelinePhotoInset({ src, alt }: { src: string; alt: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-5%" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="group relative mt-6 aspect-[16/10] overflow-hidden rounded-2xl ring-1 ring-navy/10 shadow-md"
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        sizes="(max-width: 768px) 100vw, 480px"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/50 to-transparent px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90">
          {alt}
        </p>
      </div>
    </motion.div>
  );
}

export function TimelineCard({ item, index, align = "left" }: TimelineCardProps) {
  const hasImage = Boolean(item.image && item.imagePlacement);
  const imageBefore = item.imagePlacement === "before" && item.image;
  const imageAfter = item.imagePlacement === "after" && item.image;

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{
        duration: 0.65,
        delay: index * 0.07,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -3 }}
      className={cn(
        "card-timeline overflow-hidden transition-shadow duration-400 hover:shadow-xl",
        align === "right" && "md:text-right"
      )}
    >
      {imageBefore && <TimelinePhotoBanner src={item.image!} alt={item.title} />}

      <div className="relative px-6 py-7 sm:px-8 sm:py-8">
        <div
          className={cn(
            "flex items-center gap-3",
            align === "right" && "md:flex-row-reverse"
          )}
        >
          <span className="eyebrow-pill shrink-0">{item.year}</span>
          <div
            className={cn(
              "h-px flex-1 bg-gradient-to-r from-red/40 via-blue/30 to-cyan/30",
              align === "right" && "md:bg-gradient-to-l"
            )}
          />
        </div>

        <h3 className="mt-5 font-display text-2xl font-light text-navy sm:text-3xl">
          {item.title}
        </h3>

        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          {item.description}
        </p>

        {imageAfter && (
          <TimelinePhotoInset src={item.image!} alt={item.title} />
        )}
      </div>

      {!hasImage && (
        <div className="brand-accent-bar h-[3px] opacity-70" />
      )}
    </motion.article>
  );
}
