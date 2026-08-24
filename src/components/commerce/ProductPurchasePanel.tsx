"use client";

import { useEffect, useState } from "react";
import {
  formatProductPriceDisplay,
  isNumericRateValue,
  productSellingUnitSubtitle,
} from "@/lib/catalog/product-pricing";
import { ProductActions } from "@/components/commerce/AddToCartButton";
import { ProductAccordions } from "@/components/commerce/ProductAccordions";
import { ProductOptionSelector } from "@/components/commerce/ProductOptionSelector";
import { OpenAssistantButton } from "@/components/assistant/OpenAssistantButton";

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
        <header className="space-y-2">
          <h1 className="font-display text-2xl leading-tight text-navy sm:text-3xl lg:text-[2rem]">
            {productName}
          </h1>
          {sku ? <p className="text-xs tracking-wide text-muted">{sku}</p> : null}
          <p className="text-sm text-navy/70">{brandName ?? categoryName}</p>
        </header>

        <div className="space-y-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {priceDisplay.showFromPrefix ? (
              <span className="text-sm font-medium uppercase tracking-wide text-muted">From</span>
            ) : null}
            {hasDiscount && priceDisplay.compareAt ? (
              <span className="text-base text-muted line-through">{priceDisplay.compareAt}</span>
            ) : null}
            <span className="text-xl font-medium text-red sm:text-2xl">{priceDisplay.primary}</span>
            {hasDiscount ? (
              <span className="text-sm font-medium text-red">
                Save {priceDisplay.discountPercentage}%
              </span>
            ) : null}
          </div>
          {unitSubtitle && !isNumericRateValue(sellingUnit) ? (
            <p className="text-sm text-muted">{unitSubtitle}</p>
          ) : priceDisplay.unitLabel && isNumericRateValue(sellingUnit) ? (
            <p className="text-sm text-muted">Final price depends on room size · sold per sq ft</p>
          ) : null}
        </div>

        {colorOptions.length > 0 && onColorChange ? (
          <ProductOptionSelector
            label="Color"
            options={colorOptions}
            value={selectedColorId}
            onChange={onColorChange}
          />
        ) : null}

        {sizeOptions.length > 0 && onSizeChange ? (
          <ProductOptionSelector
            label="Size"
            options={sizeOptions}
            value={selectedSizeId}
            onChange={onSizeChange}
          />
        ) : null}

        {variantId && inStock ? (
          <ProductActions variantId={variantId} productName={productName} className="pt-1" />
        ) : !inStock ? (
          <div className="border border-navy/10 bg-brand-50 px-4 py-4 text-sm text-muted">
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
      </div>

      <ProductAccordions description={description} productName={productName} specs={specs} />

      <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-navy/70">
        <span className="font-medium uppercase tracking-[0.12em]">Share</span>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-navy hover:underline"
        >
          Share
        </a>
        <a
          href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-navy hover:underline"
        >
          Tweet
        </a>
      </div>
    </div>
  );
}
