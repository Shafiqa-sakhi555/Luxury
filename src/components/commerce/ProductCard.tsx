"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, ShoppingCart } from "lucide-react";
import type { CatalogProduct } from "@/types/catalog";
import { formatProductPriceDisplay, productSellingUnitSubtitle } from "@/lib/catalog/product-pricing";
import { addItemToCart } from "@/lib/cart-client";
import { getOptimizedImageUrl } from "@/lib/cloudinary/url";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StockBadge } from "@/components/commerce/StockBadge";
import { toast } from "sonner";

function productSubtitle(product: CatalogProduct) {
  const unitNote = productSellingUnitSubtitle({
    salePriceMinor: product.salePriceMinor,
    originalPriceMinor: product.originalPriceMinor,
    sellingUnit: product.sellingUnit,
    categorySlug: product.category.slug,
    size: product.size,
  });
  return [unitNote, product.size].filter(Boolean).join(" · ");
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
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);
  const [adding, setAdding] = useState(false);

  const primaryImage =
    product.images.find((i) => i.isPrimary)?.url ??
    product.images[0]?.url ??
    null;

  const priceInput = {
    salePriceMinor: product.salePriceMinor,
    originalPriceMinor: product.originalPriceMinor,
    sellingUnit: product.sellingUnit,
    categorySlug: product.category.slug,
    size: product.size,
    prefix: product.hasVariants ? "From" : null,
  };
  const priceDisplay = formatProductPriceDisplay(priceInput);
  const hasDiscount = priceDisplay.discountPercentage > 0;
  const subtitle = productSubtitle(product);
  const inStock = isInStock(product.stockStatus);
  const canAddFromCard = Boolean(product.variantId && !product.hasVariants && inStock);

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!product.variantId) {
      toast.error("This product is not available for cart yet.");
      return;
    }

    setAdding(true);
    try {
      await addItemToCart(product.variantId);
      toast.success("Added to cart", {
        description: product.name,
        action: {
          label: "View cart",
          onClick: () => router.push("/cart"),
        },
      });
      router.refresh();
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
      className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-navy/8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-navy/10 hover:ring-red/20"
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-luxury-cream">
          {primaryImage ? (
            <Image
              src={getOptimizedImageUrl(primaryImage, { width: 720, height: 900, crop: "fill" })}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priorityImage}
              loading={priorityImage ? undefined : "lazy"}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-50 to-mist">
              <span className="font-display text-sm text-navy/40">{product.category.name}</span>
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5 sm:left-3 sm:top-3">
            {hasDiscount && (
              <span className="rounded-full bg-red px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                -{priceDisplay.discountPercentage}%
              </span>
            )}
            {product.isFeatured && (
              <span className="rounded-full bg-navy/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                Featured
              </span>
            )}
            {!inStock && (
              <span className="rounded-full bg-navy/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
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
            className="absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md ring-1 ring-navy/8 transition-all hover:scale-110 sm:right-3 sm:top-3"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={cn(
                "h-4 w-4",
                wishlisted ? "fill-red text-red" : "text-navy/40"
              )}
            />
          </button>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-red/80 sm:text-[11px]">
          {product.category.name}
        </p>
        <Link href={`/products/${product.slug}`}>
          <h2 className="mt-1 line-clamp-2 font-display text-[0.95rem] leading-snug text-navy transition hover:text-red sm:text-lg">
            {product.name}
          </h2>
        </Link>
        {subtitle && (
          <p className="mt-0.5 text-[11px] text-muted sm:text-xs">{subtitle}</p>
        )}
        {product.hasVariants && (product.variantCount ?? 0) > 1 && (
          <p className="mt-0.5 text-[11px] text-muted sm:text-xs">
            {product.variantCount} sizes available
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="flex flex-wrap items-baseline gap-1.5">
            {priceDisplay.showFromPrefix && (
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted sm:text-[11px]">
                From
              </span>
            )}
            <span className="font-display text-lg font-medium text-navy sm:text-xl">
              {priceDisplay.primary}
            </span>
            {priceDisplay.compareAt && (
              <span className="text-[11px] text-muted line-through sm:text-xs">
                {priceDisplay.compareAt}
              </span>
            )}
          </div>
          {inStock ? (
            <StockBadge status={product.stockStatus} className="origin-right scale-90" />
          ) : (
            <span className="text-[10px] font-medium uppercase tracking-wide text-navy/50 sm:text-[11px]">
              Unavailable
            </span>
          )}
        </div>

        {canAddFromCard ? (
          <Button
            type="button"
            variant="default"
            size="sm"
            className="mt-3 w-full gap-2"
            disabled={adding}
            onClick={handleAddToCart}
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
