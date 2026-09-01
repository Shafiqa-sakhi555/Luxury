"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Shield, Truck } from "lucide-react";
import {
  formatProductPriceDisplay,
  isNumericRateValue,
  productSellingUnitSubtitle,
} from "@/lib/catalog/product-pricing";
import { ProductActions } from "@/components/commerce/AddToCartButton";
import { ProductAccordions } from "@/components/commerce/ProductAccordions";
import { ProductOptionSelector } from "@/components/commerce/ProductOptionSelector";
import { OpenAssistantButton } from "@/components/assistant/OpenAssistantButton";
import { ProductFeedback } from "@/components/commerce/ProductFeedback";
import type { ProductReview } from "@/types/product-review";

type ProductPurchasePanelProps = {
  productName: string;
  categoryName: string;
  brandName?: string | null;
  salePriceMinor: number;
  originalPriceMinor: number;
  sellingUnit?: string | null;
  categorySlug?: string | null;
  size?: string | null;
  showFromPrefix?: boolean;
  sku?: string | null;
  stockStatus?: string | null;
  variantId?: string | null;
  description?: string | null;
  specs?: Array<{ label: string; value: string }>;
  colorOptions?: Array<{ id: string; label: string }>;
  sizeOptions?: Array<{ id: string; label: string }>;
  selectedColorId?: string;
  selectedSizeId?: string;
  onColorChange?: (id: string) => void;
  onSizeChange?: (id: string) => void;
  productId?: string;
  productSlug?: string;
  reviews?: ProductReview[];
  deliveryFeeLabel?: string;
  freeDeliveryThresholdLabel?: string;
};

export function ProductPurchasePanel({
  productName,
  categoryName,
  brandName,
  salePriceMinor,
  originalPriceMinor,
  sellingUnit,
  categorySlug,
  size,
  showFromPrefix = false,
  sku,
  stockStatus,
  variantId,
  description,
  specs = [],
  colorOptions = [],
  sizeOptions = [],
  selectedColorId = "",
  selectedSizeId = "",
  onColorChange,
  onSizeChange,
  productId,
  productSlug,
  reviews = [],
  deliveryFeeLabel,
  freeDeliveryThresholdLabel,
}: ProductPurchasePanelProps) {
  const priceInput = {
    salePriceMinor,
    originalPriceMinor,
    sellingUnit,
    categorySlug,
    size,
    prefix: showFromPrefix ? "From" : null,
  };
  const priceDisplay = formatProductPriceDisplay(priceInput);
  const hasDiscount = priceDisplay.discountPercentage > 0;
  const unitSubtitle = productSellingUnitSubtitle(priceInput);
  const inStock =
    stockStatus === "in_stock" ||
    stockStatus === "unknown" ||
    stockStatus === null ||
    stockStatus === undefined;
  const [shareLink, setShareLink] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareLink(window.location.href);
    }
  }, []);

  const encodedUrl = encodeURIComponent(shareLink || "https://jalalshomesolutions.vercel.app");
  const encodedTitle = encodeURIComponent(productName);

  return (
    <div className="flex flex-col">
      <div className="space-y-5">
        <header className="space-y-2.5">
          <p className="eyebrow-pill">{categoryName}</p>
          <h1 className="font-display text-3xl leading-[1.15] tracking-tight text-navy sm:text-4xl">
            {productName}
          </h1>
          <p className="text-sm text-navy/65">{brandName ?? categoryName}</p>
          {sku ? <p className="text-xs tracking-wide text-muted">SKU {sku}</p> : null}
        </header>

        <div className="rounded-2xl border border-navy/8 bg-luxury-cream/80 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {priceDisplay.showFromPrefix ? (
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                From
              </span>
            ) : null}
            {hasDiscount && priceDisplay.compareAt ? (
              <span className="text-base text-muted line-through">{priceDisplay.compareAt}</span>
            ) : null}
            <span className="font-display text-3xl font-medium text-navy sm:text-4xl">
              {priceDisplay.primary}
            </span>
            {hasDiscount ? (
              <span className="rounded-full bg-red/10 px-2.5 py-0.5 text-xs font-semibold text-red">
                Save {priceDisplay.discountPercentage}%
              </span>
            ) : null}
          </div>
          {unitSubtitle && !isNumericRateValue(sellingUnit) ? (
            <p className="mt-1.5 text-sm text-muted">{unitSubtitle}</p>
          ) : priceDisplay.unitLabel && isNumericRateValue(sellingUnit) ? (
            <p className="mt-1.5 text-sm text-muted">
              Final price depends on room size · sold per sq ft
            </p>
          ) : null}
        </div>

        {colorOptions.length > 0 && onColorChange ? (
          <ProductOptionSelector
            label="Available colors"
            options={colorOptions}
            value={selectedColorId}
            onChange={onColorChange}
          />
        ) : null}

        {sizeOptions.length > 0 && onSizeChange ? (
          <ProductOptionSelector
            label="Available sizes"
            options={sizeOptions}
            value={selectedSizeId}
            onChange={onSizeChange}
          />
        ) : null}

        {variantId && inStock ? (
          <ProductActions variantId={variantId} productName={productName} className="pt-1" />
        ) : !inStock ? (
          <div className="rounded-2xl border border-navy/10 bg-brand-50 px-4 py-4 text-sm text-muted">
            This item is currently unavailable online.{" "}
            <OpenAssistantButton
              variant="ghost"
              size="sm"
              prompt={`Is ${productName} available or can you suggest alternatives?`}
              className="h-auto px-0 text-navy underline underline-offset-2 hover:bg-transparent"
            >
              Ask Jalal Assistance
            </OpenAssistantButton>
          </div>
        ) : null}

        <ul className="grid grid-cols-3 gap-2 text-center text-[11px] text-navy/70 sm:text-xs">
          <li className="flex flex-col items-center gap-1.5 rounded-xl border border-navy/8 bg-white px-2 py-3">
            <Truck className="h-4 w-4 text-red" aria-hidden />
            <span>Pakistan-wide delivery</span>
          </li>
          <li className="flex flex-col items-center gap-1.5 rounded-xl border border-navy/8 bg-white px-2 py-3">
            <Shield className="h-4 w-4 text-red" aria-hidden />
            <span>Quality guaranteed</span>
          </li>
          <li className="flex flex-col items-center gap-1.5 rounded-xl border border-navy/8 bg-white px-2 py-3">
            <RotateCcw className="h-4 w-4 text-red" aria-hidden />
            <span>Easy returns</span>
          </li>
        </ul>

        {productId && productSlug ? (
          <ProductFeedback productId={productId} productSlug={productSlug} reviews={reviews} />
        ) : null}
      </div>

      <ProductAccordions
        description={description}
        productName={productName}
        specs={specs}
        deliveryFeeLabel={deliveryFeeLabel}
        freeDeliveryThresholdLabel={freeDeliveryThresholdLabel}
      />

      <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-navy/70">
        <span className="font-semibold uppercase tracking-[0.14em]">Share</span>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-navy hover:underline"
        >
          Facebook
        </a>
        <a
          href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-navy hover:underline"
        >
          X
        </a>
      </div>
    </div>
  );
}
