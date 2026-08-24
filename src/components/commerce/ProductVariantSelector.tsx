"use client";

import { useMemo, useState } from "react";
import type { CatalogProduct, CatalogProductVariant } from "@/types/catalog";
import { isNumericRateValue } from "@/lib/catalog/product-pricing";
import { ProductGallery } from "@/components/commerce/ProductGallery";
import { ProductPurchasePanel } from "@/components/commerce/ProductPurchasePanel";

function buildColorOptions(variants: CatalogProductVariant[]) {
  const colors = new Map<string, { id: string; label: string }>();
  for (const variant of variants) {
    const label = variant.color?.trim();
    if (!label) continue;
    if (!colors.has(label)) colors.set(label, { id: label, label });
  }
  return [...colors.values()];
}

function buildSizeOptions(variants: CatalogProductVariant[]) {
  const sizes = new Map<string, { id: string; label: string }>();
  for (const variant of variants) {
    const label = variant.size?.trim();
    if (!label) continue;
    if (!sizes.has(label)) sizes.set(label, { id: label, label });
  }
  return [...sizes.values()];
}

function pickVariant(
  variants: CatalogProductVariant[],
  colorId: string,
  sizeId: string
): CatalogProductVariant | undefined {
  return (
    variants.find((variant) => {
      const colorMatch = !colorId || variant.color === colorId;
      const sizeMatch = !sizeId || variant.size === sizeId;
      return colorMatch && sizeMatch;
    }) ?? variants[0]
  );
}

function buildSpecs(product: CatalogProduct, selected?: CatalogProductVariant) {
  return [
    product.includedItems && { label: "What's included", value: product.includedItems },
    product.fabric && { label: "Fabric", value: product.fabric },
    product.design && { label: "Design", value: product.design },
    product.size && { label: "Size", value: product.size },
    selected?.design && { label: "Design", value: selected.design },
    selected?.color && { label: "Color", value: selected.color },
    selected?.quality && { label: "Quality", value: selected.quality },
    product.sellingUnit &&
      !isNumericRateValue(product.sellingUnit) && {
        label: "Unit",
        value: product.sellingUnit,
      },
    ...product.specifications.map((spec) => ({
      label: spec.key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
      value: spec.value,
    })),
  ].filter(Boolean) as Array<{ label: string; value: string }>;
}

export function ProductVariantSelector({ product }: { product: CatalogProduct }) {
  const variants = useMemo(() => product.variants ?? [], [product.variants]);
  const colorOptions = useMemo(() => buildColorOptions(variants), [variants]);
  const sizeOptions = useMemo(() => buildSizeOptions(variants), [variants]);
  const defaultVariant = variants.find((variant) => variant.isDefault) ?? variants[0];
  const [selectedColorId, setSelectedColorId] = useState(defaultVariant?.color ?? colorOptions[0]?.id ?? "");
  const [selectedSizeId, setSelectedSizeId] = useState(defaultVariant?.size ?? sizeOptions[0]?.id ?? "");

  const selected = useMemo(
    () => pickVariant(variants, selectedColorId, selectedSizeId) ?? defaultVariant,
    [variants, selectedColorId, selectedSizeId, defaultVariant]
  );

  if (!selected || variants.length === 0) return null;

  const galleryImages = selected.images.length > 0 ? selected.images : product.images;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12 xl:gap-16">
      <ProductGallery
        images={galleryImages.map((img) => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
          sortOrder: img.sortOrder,
        }))}
        productName={product.name}
      />
      <div className="sticky-below-header lg:self-start">
        <ProductPurchasePanel
          productName={product.name}
          categoryName={product.category.name}
          brandName={product.brand?.name ?? product.category.name}
          salePriceMinor={selected.salePriceMinor}
          originalPriceMinor={selected.originalPriceMinor}
          sellingUnit={product.sellingUnit}
          categorySlug={product.category.slug}
          size={selected.size ?? product.size}
          showFromPrefix={variants.length > 1}
          sku={selected.sku}
          stockStatus={selected.stockStatus}
          variantId={selected.id}
          description={product.description}
          specs={buildSpecs(product, selected)}
          colorOptions={colorOptions}
          sizeOptions={sizeOptions}
          selectedColorId={selectedColorId}
          selectedSizeId={selectedSizeId}
          onColorChange={colorOptions.length > 0 ? setSelectedColorId : undefined}
          onSizeChange={sizeOptions.length > 0 ? setSelectedSizeId : undefined}
        />
      </div>
    </div>
  );
}

export function ProductSimpleDetail({ product }: { product: CatalogProduct }) {
  const colorOptions = product.fabric
    ? [{ id: product.fabric, label: product.fabric }]
    : product.design
      ? [{ id: product.design, label: product.design }]
      : [];
  const sizeOptions = product.size ? [{ id: product.size, label: product.size }] : [];
  const [selectedColorId, setSelectedColorId] = useState(colorOptions[0]?.id ?? "");
  const [selectedSizeId, setSelectedSizeId] = useState(sizeOptions[0]?.id ?? "");

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12 xl:gap-16">
      <ProductGallery
        images={product.images.map((img) => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
          sortOrder: img.sortOrder,
        }))}
        productName={product.name}
      />
      <div className="sticky-below-header lg:self-start">
        <ProductPurchasePanel
          productName={product.name}
          categoryName={product.category.name}
          brandName={product.brand?.name ?? product.category.name}
          salePriceMinor={product.salePriceMinor}
          originalPriceMinor={product.originalPriceMinor}
          sellingUnit={product.sellingUnit}
          categorySlug={product.category.slug}
          size={product.size}
          sku={product.sku}
          stockStatus={product.stockStatus}
          variantId={product.variantId}
          description={product.description}
          specs={buildSpecs(product)}
          colorOptions={colorOptions}
          sizeOptions={sizeOptions}
          selectedColorId={selectedColorId}
          selectedSizeId={selectedSizeId}
          onColorChange={colorOptions.length > 0 ? setSelectedColorId : undefined}
          onSizeChange={sizeOptions.length > 0 ? setSelectedSizeId : undefined}
        />
      </div>
    </div>
  );
}
