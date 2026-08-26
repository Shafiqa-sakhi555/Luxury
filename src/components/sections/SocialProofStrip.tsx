"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import type { StorefrontReview } from "@/types/admin-review";

export function SocialProofStrip({ reviews = [] }: { reviews?: StorefrontReview[] }) {
  const avatars = reviews.slice(0, 4);
  const avg =
    reviews.length === 0
      ? 4.9
      : Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) /
        10;

  return (
    <section
      aria-label="Customer reviews"
      className="border-y border-navy/8 bg-luxury-cream py-8 sm:py-10"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 text-center sm:flex-row sm:justify-center sm:gap-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-2"
        >
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-red text-red sm:h-5 sm:w-5" />
            ))}
          </div>
          <span className="text-sm font-semibold text-navy sm:text-base">{avg}/5</span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="max-w-md text-sm text-muted sm:text-base"
        >
          Trusted by thousands of homeowners across Pakistan.
        </motion.p>

        {avatars.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.12 }}
            className="flex -space-x-2"
          >
            {avatars.map((review) => (
              <div
                key={review.id}
                className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-white sm:h-10 sm:w-10"
              >
                <Image src={review.imageUrl} alt={review.name} fill className="object-cover" sizes="40px" />
              </div>
            ))}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red text-[10px] font-bold text-white ring-2 ring-white sm:h-10 sm:w-10 sm:text-xs">
              50K+
            </div>
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}
