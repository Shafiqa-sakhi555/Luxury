"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/money";
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
  discountPercentage: number;
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
};

export function ProductPurchasePanel({
  productName,
  categoryName,
  brandName,
  salePriceMinor,
  originalPriceMinor,
  discountPercentage,
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
}: ProductPurchasePanelProps) {
  const hasDiscount = originalPriceMinor > salePriceMinor;
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

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {hasDiscount ? (
            <span className="text-base text-muted line-through">
              {formatMoney(originalPriceMinor)}
            </span>
          ) : null}
          <span className="text-xl font-medium text-red sm:text-2xl">
            {formatMoney(salePriceMinor)}
          </span>
          {hasDiscount ? (
            <span className="text-sm font-medium text-red">
              Save {Math.round(discountPercentage)}%
            </span>
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

        {productId && productSlug ? (
          <ProductFeedback productId={productId} productSlug={productSlug} reviews={reviews} />
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
