"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ShoppingCart } from "lucide-react";
import type { CatalogProduct } from "@/types/catalog";
import { formatMoney } from "@/lib/money";
import { getOptimizedImageUrl } from "@/lib/cloudinary/url";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StockBadge } from "@/components/commerce/StockBadge";
import { toast } from "sonner";

function productSubtitle(product: CatalogProduct) {
  return [product.sellingUnit, product.size].filter(Boolean).join(" · ");
}

function isInStock(status: CatalogProduct["stockStatus"]) {
  return status === "in_stock" || status === "unknown" || status === null;
}

export function ProductCard({
  product,
  index = 0,
  priorityImage = false,
}: {
  product: CatalogProduct;
  index?: number;
  priorityImage?: boolean;
}) {
  const [wishlisted, setWishlisted] = useState(false);
  const [adding, setAdding] = useState(false);

  const primaryImage =
    product.images.find((i) => i.isPrimary)?.url ??
    product.images[0]?.url ??
    null;

  const hasDiscount = product.originalPriceMinor > product.salePriceMinor;
  const subtitle = productSubtitle(product);
  const inStock = isInStock(product.stockStatus);

  async function addToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!product.variantId) {
      toast.error("This product is not available for cart yet.");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ variantId: product.variantId, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success("Added to cart");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add to cart");
    } finally {
      setAdding(false);
    }
  }

  return (
    <motion.article
      initial={index < 8 ? { opacity: 0, y: 16 } : false}
      whileInView={index < 8 ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, margin: "-5%" }}
      transition={{ duration: 0.35, delay: Math.min(index, 7) * 0.03 }}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-navy/8 transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-red/20"
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-mist">
          {primaryImage ? (
            <Image
              src={getOptimizedImageUrl(primaryImage, { width: 600, height: 600, crop: "fill" })}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priorityImage}
              loading={priorityImage ? undefined : "lazy"}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-50 to-mist">
              <span className="font-display text-sm text-navy/40">{product.category.name}</span>
            </div>
          )}

          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5 sm:left-3 sm:top-3">
            {hasDiscount && (
              <span className="rounded-md bg-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                -{Math.round(product.discountPercentage)}%
              </span>
            )}
            {product.isFeatured && (
              <span className="rounded-md bg-navy/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                Featured
              </span>
            )}
            {!inStock && (
              <span className="rounded-md bg-navy/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                Sold out
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setWishlisted((v) => !v);
              toast.success(wishlisted ? "Removed from wishlist" : "Saved to wishlist");
            }}
            className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm transition-all hover:scale-110 sm:right-3 sm:top-3 sm:h-9 sm:w-9"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={cn(
                "h-3.5 w-3.5 sm:h-4 sm:w-4",
                wishlisted ? "fill-red text-red" : "text-navy/35"
              )}
            />
          </button>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-blue sm:text-[11px]">
          {product.category.name}
        </p>
        <Link href={`/products/${product.slug}`}>
          <h2 className="mt-1 line-clamp-2 font-display text-sm leading-snug text-navy transition hover:text-red sm:text-base">
            {product.name}
          </h2>
        </Link>
        {subtitle && (
          <p className="mt-0.5 text-[11px] text-muted sm:text-xs">{subtitle}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="flex flex-wrap items-baseline gap-1.5">
            {product.hasVariants && (
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted sm:text-[11px]">
                From
              </span>
            )}
            <span className="text-sm font-semibold text-navy sm:text-base">
              {formatMoney(product.salePriceMinor)}
            </span>
            {hasDiscount && (
              <span className="text-[11px] text-muted line-through sm:text-xs">
                {formatMoney(product.originalPriceMinor)}
              </span>
            )}
          </div>
          {inStock ? (
            <StockBadge status={product.stockStatus} className="scale-90 origin-right" />
          ) : (
            <span className="text-[10px] font-medium uppercase tracking-wide text-navy/50 sm:text-[11px]">
              Unavailable
            </span>
          )}
        </div>

        {product.variantId && !product.hasVariants && inStock ? (
          <Button
            type="button"
            variant="default"
            size="sm"
            className="mt-3 w-full"
            disabled={adding}
            onClick={addToCart}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {adding ? "Adding..." : "Add to Cart"}
          </Button>
        ) : (
          <Button asChild variant="secondary" size="sm" className="mt-3 w-full">
            <Link href={`/products/${product.slug}`}>
              {product.hasVariants ? "Choose options" : "View product"}
            </Link>
          </Button>
        )}
      </div>
    </motion.article>
  );
}
