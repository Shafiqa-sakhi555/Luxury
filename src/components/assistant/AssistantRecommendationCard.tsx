"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { AssistantProductRecommendation } from "@/types/assistant";
import { getOptimizedImageUrl } from "@/lib/cloudinary/url";
import { cn } from "@/lib/utils";

export function AssistantRecommendationCard({
  product,
  className,
}: {
  product: AssistantProductRecommendation;
  className?: string;
}) {
  const imageSrc = product.imageUrl
    ? getOptimizedImageUrl(product.imageUrl, { width: 160, height: 160, crop: "fill" })
    : null;

  return (
    <Link
      href={product.url}
      className={cn(
        "group flex gap-3 rounded-xl border border-white/12 bg-white/5 p-3 transition-all hover:border-cyan/30 hover:bg-white/8",
        className
      )}
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white/10 ring-1 ring-white/10">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="64px"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-1 text-center">
            <span className="text-[9px] font-medium uppercase tracking-wide text-white/40">
              {product.category}
            </span>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="line-clamp-2 text-xs font-medium leading-snug text-white sm:text-sm">
              {product.name}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-white/45">
              {product.category}
            </p>
          </div>
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-white/30 transition group-hover:text-cyan" />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-red">{product.price}</span>
          {product.inStock === false ? (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">
              Out of stock
            </span>
          ) : (
            <span className="rounded-full bg-emerald/15 px-2 py-0.5 text-[10px] font-medium text-emerald">
              In stock
            </span>
          )}
        </div>

        {product.reason ? (
          <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-white/55">
            {product.reason}
          </p>
        ) : product.shortDescription ? (
          <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-white/55">
            {product.shortDescription}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
