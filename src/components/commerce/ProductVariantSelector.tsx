"use client";

import { useMemo, useState } from "react";
import type { CatalogProduct, CatalogProductVariant } from "@/types/catalog";
import { cn } from "@/lib/utils";
import { ProductGallery } from "@/components/commerce/ProductGallery";
import { ProductPurchasePanel } from "@/components/commerce/ProductPurchasePanel";
import { Card } from "@/components/ui/card";

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

  const galleryImages = selected.images.length > 0 ? selected.images : product.images;
  const priceSubtitle = [product.sellingUnit, product.size].filter(Boolean).join(" · ");

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

      <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
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

        <ProductPurchasePanel
          salePriceMinor={selected.salePriceMinor}
          originalPriceMinor={selected.originalPriceMinor}
          discountPercentage={selected.discountPercentage}
          priceSubtitle={priceSubtitle}
          sellingUnit={product.sellingUnit}
          sku={selected.sku}
          stockStatus={selected.stockStatus}
          variantId={selected.id}
          productName={product.name}
          assistantPrompt={`Tell me about ${product.name} design ${selected.design ?? selected.name}.`}
        />

        {(selected.design || selected.color || selected.quality) && (
          <Card padding="md" variant="muted">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              Selected design details
            </p>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              {selected.design && <Spec label="Design" value={selected.design} />}
              {selected.color && <Spec label="Color" value={selected.color} />}
              {selected.quality && <Spec label="Quality" value={selected.quality} />}
            </dl>
          </Card>
        )}
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
      <span className="block font-medium">
        {variant.design ? `Design ${variant.design}` : variant.name}
      </span>
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
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-navy">{value}</dd>
    </div>
  );
}
