"use client";

import { useMemo, useState } from "react";
import type { CatalogProduct, CatalogProductVariant } from "@/types/catalog";
import { isNumericRateValue } from "@/lib/catalog/product-pricing";
import { mergeColorOptions, parseProductColors } from "@/lib/catalog/product-colors";
import {
  parseProductSizes,
  pickProductVariant,
  productUsesVariantSelector,
} from "@/lib/catalog/product-sizes";
import { ProductGallery } from "@/components/commerce/ProductGallery";
import { ProductPurchasePanel } from "@/components/commerce/ProductPurchasePanel";
import type { ProductReview } from "@/types/product-review";

function buildColorOptions(product: CatalogProduct, variants: CatalogProductVariant[]) {
  const fromVariants: Array<{ id: string; label: string }> = [];
  for (const variant of variants) {
    const label = variant.color?.trim();
    if (!label) continue;
    if (!fromVariants.some((entry) => entry.id === label)) {
      fromVariants.push({ id: label, label });
    }
  }
  return mergeColorOptions(product, fromVariants);
}

function buildSpecs(product: CatalogProduct, selected?: CatalogProductVariant) {
  return [
    product.includedItems && { label: "What's included", value: product.includedItems },
    product.fabric && { label: "Fabric", value: product.fabric },
    product.design && { label: "Design", value: product.design },
    selected?.design && { label: "Design", value: selected.design },
    selected?.color && { label: "Color", value: selected.color },
    selected?.quality && { label: "Quality", value: selected.quality },
    selected?.weight && { label: "Weight", value: selected.weight },
    selected?.dimensions && { label: "Dimensions", value: selected.dimensions },
    product.sellingUnit &&
      !isNumericRateValue(product.sellingUnit) && {
        label: "Unit",
        value: product.sellingUnit,
      },
    ...product.specifications
      .filter((spec) => spec.key !== "colors")
      .map((spec) => ({
        label: spec.key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
        value: spec.value,
      })),
  ].filter(Boolean) as Array<{ label: string; value: string }>;
}

export function ProductVariantSelector({
  product,
  reviews = [],
  deliveryFeeLabel,
  freeDeliveryThresholdLabel,
}: {
  product: CatalogProduct;
  reviews?: ProductReview[];
  deliveryFeeLabel?: string;
  freeDeliveryThresholdLabel?: string;
}) {
  const variants = useMemo(() => product.variants ?? [], [product.variants]);
  const colorOptions = useMemo(() => buildColorOptions(product, variants), [product, variants]);
  const sizeOptions = useMemo(() => parseProductSizes(product), [product]);
  const defaultVariant = variants.find((variant) => variant.isDefault) ?? variants[0];
  const [selectedColorId, setSelectedColorId] = useState(
    defaultVariant?.color ?? colorOptions[0]?.id ?? ""
  );
  const [selectedSizeId, setSelectedSizeId] = useState(
    defaultVariant?.size ?? sizeOptions[0]?.id ?? ""
  );

  const activeColorId = selectedColorId || colorOptions[0]?.id || "";
  const activeSizeId = selectedSizeId || sizeOptions[0]?.id || "";

  const selected = useMemo(
    () => pickProductVariant(variants, activeColorId, activeSizeId) ?? defaultVariant,
    [variants, activeColorId, activeSizeId, defaultVariant]
  );

  if (!selected || variants.length === 0) return null;

  const galleryImages = selected.images.length > 0 ? selected.images : product.images;
  const showFromPrefix = sizeOptions.length > 1 || variants.length > 1;

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
          showFromPrefix={showFromPrefix}
          sku={selected.sku}
          stockStatus={selected.stockStatus}
          variantId={selected.id}
          description={product.description}
          specs={buildSpecs(product, selected)}
          colorOptions={colorOptions}
          sizeOptions={sizeOptions}
          selectedColorId={activeColorId}
          selectedSizeId={activeSizeId}
          onColorChange={colorOptions.length > 0 ? setSelectedColorId : undefined}
          onSizeChange={sizeOptions.length > 0 ? setSelectedSizeId : undefined}
          productId={product.id}
          productSlug={product.slug}
          reviews={reviews}
          deliveryFeeLabel={deliveryFeeLabel}
          freeDeliveryThresholdLabel={freeDeliveryThresholdLabel}
        />
      </div>
    </div>
  );
}

export function ProductSimpleDetail({
  product,
  reviews = [],
  deliveryFeeLabel,
  freeDeliveryThresholdLabel,
}: {
  product: CatalogProduct;
  reviews?: ProductReview[];
  deliveryFeeLabel?: string;
  freeDeliveryThresholdLabel?: string;
}) {
  if (productUsesVariantSelector(product)) {
    return (
      <ProductVariantSelector
        product={product}
        reviews={reviews}
        deliveryFeeLabel={deliveryFeeLabel}
        freeDeliveryThresholdLabel={freeDeliveryThresholdLabel}
      />
    );
  }

  return (
    <ProductSimpleDetailView
      product={product}
      reviews={reviews}
      deliveryFeeLabel={deliveryFeeLabel}
      freeDeliveryThresholdLabel={freeDeliveryThresholdLabel}
    />
  );
}

function ProductSimpleDetailView({
  product,
  reviews = [],
  deliveryFeeLabel,
  freeDeliveryThresholdLabel,
}: {
  product: CatalogProduct;
  reviews?: ProductReview[];
  deliveryFeeLabel?: string;
  freeDeliveryThresholdLabel?: string;
}) {
  const colorOptions = useMemo(() => parseProductColors(product), [product]);
  const sizeOptions = useMemo(() => parseProductSizes(product), [product]);
  const [selectedColorId, setSelectedColorId] = useState("");
  const [selectedSizeId, setSelectedSizeId] = useState("");

  const activeColorId = selectedColorId || colorOptions[0]?.id || "";
  const activeSizeId = selectedSizeId || sizeOptions[0]?.id || "";

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
          size={activeSizeId || product.size}
          sku={product.sku}
          stockStatus={product.stockStatus}
          variantId={product.variantId}
          description={product.description}
          specs={buildSpecs(product)}
          colorOptions={colorOptions}
          sizeOptions={sizeOptions}
          selectedColorId={activeColorId}
          selectedSizeId={activeSizeId}
          onColorChange={colorOptions.length > 0 ? setSelectedColorId : undefined}
          onSizeChange={sizeOptions.length > 0 ? setSelectedSizeId : undefined}
          productId={product.id}
          productSlug={product.slug}
          reviews={reviews}
          deliveryFeeLabel={deliveryFeeLabel}
          freeDeliveryThresholdLabel={freeDeliveryThresholdLabel}
        />
      </div>
    </div>
  );
}

export { productUsesVariantSelector };
