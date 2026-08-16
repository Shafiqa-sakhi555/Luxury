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
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 to-mist ring-1 ring-navy/8">
        <div className="flex h-full items-center justify-center">
          <span className="font-display text-lg text-navy/30">{productName}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="group relative aspect-square overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-navy/8">
        <Image
          src={getOptimizedImageUrl(active.url, { width: 1200, crop: "limit" })}
          alt={active.alt ?? productName}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>

      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar sm:gap-3">
          {sorted.map((img, index) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-2 transition sm:h-20 sm:w-20",
                index === activeIndex
                  ? "ring-red shadow-md shadow-red/10"
                  : "ring-transparent hover:ring-navy/20"
              )}
              aria-label={`View image ${index + 1}`}
              aria-current={index === activeIndex}
            >
              <Image
                src={getOptimizedImageUrl(img.url, { width: 160, height: 160, crop: "fill" })}
                alt={img.alt ?? `${productName} ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
