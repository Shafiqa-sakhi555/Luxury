"use client";

import { useState } from "react";
import Image from "next/image";
import { getOptimizedImageUrl } from "@/lib/cloudinary/url";
import { cn } from "@/lib/utils";

type GalleryImage = {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
};

export function ProductGallery({
  images,
  productName,
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = sorted[activeIndex] ?? sorted[0];

  if (!active) {
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-brand-50">
        <div className="flex h-full items-center justify-center">
          <span className="font-display text-lg text-navy/30">{productName}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 sm:gap-4">
      {sorted.length > 1 ? (
        <div className="hidden shrink-0 flex-col gap-2 sm:flex">
          {sorted.map((img, index) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative h-16 w-16 overflow-hidden border transition lg:h-[72px] lg:w-[72px]",
                index === activeIndex
                  ? "border-navy ring-1 ring-navy"
                  : "border-navy/15 hover:border-navy/40"
              )}
              aria-label={`View image ${index + 1}`}
              aria-current={index === activeIndex}
            >
              <Image
                src={getOptimizedImageUrl(img.url, { width: 160, height: 160, crop: "fill" })}
                alt={img.alt ?? `${productName} ${index + 1}`}
                fill
                className="object-cover"
                sizes="72px"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative min-w-0 flex-1">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-white">
          <Image
            src={getOptimizedImageUrl(active.url, { width: 1200, crop: "limit" })}
            alt={active.alt ?? productName}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 45vw"
          />
        </div>

        {sorted.length > 1 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 hide-scrollbar sm:hidden">
            {sorted.map((img, index) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "relative h-16 w-16 shrink-0 overflow-hidden border transition",
                  index === activeIndex
                    ? "border-navy ring-1 ring-navy"
                    : "border-navy/15"
                )}
                aria-label={`View image ${index + 1}`}
              >
                <Image
                  src={getOptimizedImageUrl(img.url, { width: 160, height: 160, crop: "fill" })}
                  alt={img.alt ?? `${productName} ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
