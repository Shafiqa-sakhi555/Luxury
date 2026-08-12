"use client";

import { useMemo, useState } from "react";
import type { CatalogProduct, CatalogProductVariant } from "@/types/catalog";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "@/components/commerce/AddToCartButton";
import { ProductGallery } from "@/components/commerce/ProductGallery";

export function ProductVariantSelector({ product }: { product: CatalogProduct }) {
  const variants = useMemo(() => product.variants ?? [], [product.variants]);
  const [selectedId, setSelectedId] = useState(
    variants.find((v) => v.isDefault)?.id ?? variants[0]?.id ?? ""
  );

  const selected = useMemo(
    () => variants.find((v) => v.id === selectedId) ?? variants[0],
    [selectedId, variants]
  );

  if (!selected || variants.length === 0) return null;

  const hasDiscount = selected.originalPriceMinor > selected.salePriceMinor;
  const galleryImages =
    selected.images.length > 0 ? selected.images : product.images;

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
      <ProductGallery
        images={galleryImages.map((img) => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
          sortOrder: img.sortOrder,
        }))}
        productName={product.name}
      />

      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">
            Select design
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {variants.map((variant) => (
              <VariantChip
                key={variant.id}
                variant={variant}
                active={variant.id === selected.id}
                onSelect={() => setSelectedId(variant.id)}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-navy/8">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-display text-3xl font-medium text-navy sm:text-4xl">
              {formatMoney(selected.salePriceMinor)}
            </span>
            {product.sellingUnit && (
              <span className="text-sm text-muted">{product.sellingUnit}</span>
            )}
            {hasDiscount && (
              <>
                <span className="text-lg text-muted line-through">
                  {formatMoney(selected.originalPriceMinor)}
                </span>
                <span className="rounded-md bg-red px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Save {Math.round(selected.discountPercentage)}%
                </span>
              </>
            )}
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <Spec label="SKU" value={selected.sku} />
            {selected.design && <Spec label="Design" value={selected.design} />}
            {selected.color && <Spec label="Color" value={selected.color} />}
            {selected.quality && <Spec label="Quality" value={selected.quality} />}
          </dl>

          {selected.variantId &&
          (selected.stockStatus === "in_stock" ||
            selected.stockStatus === "unknown" ||
            selected.stockStatus === null) ? (
            <div className="mt-6 border-t border-navy/10 pt-6">
              <AddToCartButton variantId={selected.variantId} />
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">Currently unavailable in this design.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function VariantChip({
  variant,
  active,
  onSelect,
}: {
  variant: CatalogProductVariant;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-full border px-4 py-2 text-left text-sm transition",
        active
          ? "border-red bg-red text-white shadow-md shadow-red/20"
          : "border-navy/10 bg-white text-navy hover:border-red/30 hover:bg-red/5"
      )}
    >
      <span className="block font-medium">{variant.design ? `Design ${variant.design}` : variant.name}</span>
      {variant.color && (
        <span className={cn("block text-xs", active ? "text-white/80" : "text-muted")}>
          {variant.color}
        </span>
      )}
    </button>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-brand-50 px-4 py-3">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-navy">{value}</dd>
    </div>
  );
}
