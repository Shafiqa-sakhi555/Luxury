"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  children?: ReactNode;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "mb-10 sm:mb-16 md:mb-20",
        align === "center" && "mx-auto max-w-3xl text-center",
        className
      )}
    >
      {eyebrow && (
        <span className="mb-3 inline-block text-[10px] font-medium uppercase tracking-[0.25em] text-gold sm:mb-4 sm:text-xs sm:tracking-[0.3em]">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl font-light leading-[1.12] tracking-tight text-ivory sm:text-4xl md:text-5xl lg:text-6xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-sm leading-relaxed text-ivory/60 sm:mt-6 sm:text-base md:text-lg">
          {description}
        </p>
      )}
    </motion.div>
  );
}
