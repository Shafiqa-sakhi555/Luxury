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
  light?: boolean;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  light = false,
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
        <span className={cn("eyebrow-pill mb-4 sm:mb-5", light && "border-white/30 bg-white/10 text-white")}>
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          "font-display text-3xl font-light leading-[1.12] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl",
          light ? "text-white" : "text-navy"
        )}
      >
        {title}
      </h2>
      <div
        className={cn(
          "brand-divider mt-4 sm:mt-5",
          align === "center" && "mx-auto",
          light && "opacity-90"
        )}
      />
      {description && (
        <p
          className={cn(
            "mt-4 text-sm leading-relaxed sm:mt-6 sm:text-base md:text-lg",
            light ? "text-white/80" : "text-muted"
          )}
        >
          {description}
        </p>
      )}
    </motion.div>
  );
}
