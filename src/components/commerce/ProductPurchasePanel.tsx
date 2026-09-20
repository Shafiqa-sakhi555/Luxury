"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, RotateCcw, Ruler, Shield, Truck } from "lucide-react";
import {
  formatProductPriceDisplay,
  isNumericRateValue,
  isSquareFootPricing,
  productSellingUnitSubtitle,
} from "@/lib/catalog/product-pricing";
import { categorySlugsMatch } from "@/lib/supabase/catalog-categories";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ProductActions } from "@/components/commerce/AddToCartButton";
import { ProductAccordions } from "@/components/commerce/ProductAccordions";
import { ProductOptionSelector } from "@/components/commerce/ProductOptionSelector";
import { OpenAssistantButton } from "@/components/assistant/OpenAssistantButton";
import { ProductFeedback } from "@/components/commerce/ProductFeedback";
import type { ProductReview } from "@/types/product-review";

const CARPET_PRESETS = [
  { label: "4 × 6 ft", len: 6, wid: 4, sqFt: 24, desc: "Accent / Bedside" },
  { label: "5 × 8 ft", len: 8, wid: 5, sqFt: 40, desc: "Small Room" },
  { label: "6 × 9 ft", len: 9, wid: 6, sqFt: 54, desc: "Medium Room" },
  { label: "8 × 10 ft", len: 10, wid: 8, sqFt: 80, desc: "Living Room" },
  { label: "9 × 12 ft", len: 12, wid: 9, sqFt: 108, desc: "Large Room" },
  { label: "10 × 14 ft", len: 14, wid: 10, sqFt: 140, desc: "Hall / Master" },
];

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

  const isCarpet =
    isSquareFootPricing(priceInput) ||
    categorySlugsMatch(categorySlug, "carpets") ||
    categoryName.toLowerCase().includes("carpet");

  // Parse default dimensions from size prop if formatted like "8x10" or "6x9"
  const defaultDims = useMemo(() => {
    const match = size?.match(/\b(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\b/i);
    if (match) {
      return { len: match[1], wid: match[2] };
    }
    return { len: "10", wid: "12" };
  }, [size]);

  const [lengthFt, setLengthFt] = useState(defaultDims.len);
  const [widthFt, setWidthFt] = useState(defaultDims.wid);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (defaultDims.len && defaultDims.wid) {
      setLengthFt(defaultDims.len);
      setWidthFt(defaultDims.wid);
    }
  }, [defaultDims.len, defaultDims.wid]);

  const numLen = parseFloat(lengthFt);
  const numWid = parseFloat(widthFt);
  const isValidDimensions = !isNaN(numLen) && !isNaN(numWid) && numLen > 0 && numWid > 0;
  const areaSqFt = isValidDimensions ? Math.round(numLen * numWid * 100) / 100 : 0;
  const effectiveRateMinor =
    salePriceMinor > 0 ? salePriceMinor : originalPriceMinor > 0 ? originalPriceMinor : 0;
  const calculatedCarpetPriceMinor = isValidDimensions
    ? Math.round(effectiveRateMinor * areaSqFt)
    : 0;
  const totalOrderPriceMinor = calculatedCarpetPriceMinor * quantity;

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
          {isCarpet ? (
            <p className="mt-1.5 text-xs font-medium text-navy/75">
              Priced per square foot (ft²) · Enter your room length & width below to calculate total charge
            </p>
          ) : unitSubtitle && !isNumericRateValue(sellingUnit) ? (
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

        {isCarpet ? (
          <div className="rounded-2xl border border-navy/12 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-2 border-b border-navy/8 pb-3">
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-red" aria-hidden />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-navy">
                  Custom Carpet Dimensions
                </h2>
              </div>
              <span className="rounded-full bg-navy/5 px-2.5 py-0.5 text-[11px] font-semibold text-navy">
                In Feet (ft)
              </span>
            </div>

            <div className="mt-3.5 space-y-3.5">
              <div>
                <p className="text-xs font-medium text-navy/70">Popular Room Sizes:</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {CARPET_PRESETS.map((preset) => {
                    const isSelected =
                      (numLen === preset.len && numWid === preset.wid) ||
                      (numLen === preset.wid && numWid === preset.len);
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setLengthFt(preset.len.toString());
                          setWidthFt(preset.wid.toString());
                        }}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 text-xs font-medium transition",
                          isSelected
                            ? "border-navy bg-navy text-white shadow-xs"
                            : "border-navy/15 bg-luxury-cream/50 text-navy hover:border-navy/40 hover:bg-luxury-cream"
                        )}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="carpet-length"
                    className="block text-xs font-semibold uppercase tracking-wider text-navy"
                  >
                    Length (feet)
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="carpet-length"
                      type="number"
                      min="1"
                      max="100"
                      step="0.5"
                      value={lengthFt}
                      onChange={(e) => setLengthFt(e.target.value)}
                      placeholder="e.g. 10"
                      className="h-11 w-full rounded-xl border border-navy/20 bg-white px-3 text-sm font-medium text-navy shadow-none transition focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted">
                      ft
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="carpet-width"
                    className="block text-xs font-semibold uppercase tracking-wider text-navy"
                  >
                    Width (feet)
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="carpet-width"
                      type="number"
                      min="1"
                      max="100"
                      step="0.5"
                      value={widthFt}
                      onChange={(e) => setWidthFt(e.target.value)}
                      placeholder="e.g. 12"
                      className="h-11 w-full rounded-xl border border-navy/20 bg-white px-3 text-sm font-medium text-navy shadow-none transition focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted">
                      ft
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Calculation Display */}
              <div className="rounded-xl border border-navy/8 bg-luxury-cream/70 p-3.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between text-navy/80">
                  <span>Room Area:</span>
                  <span className="font-semibold text-navy">
                    {isValidDimensions ? `${numLen} ft × ${numWid} ft = ${areaSqFt} sq ft` : "—"}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-navy/80">
                  <span>Rate:</span>
                  <span className="font-medium text-navy">
                    {formatMoney(effectiveRateMinor)} / sq ft
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t border-navy/10 pt-2 text-sm font-semibold text-navy">
                  <span>Price per carpet piece:</span>
                  <span className="font-display text-lg text-navy">
                    {isValidDimensions ? formatMoney(calculatedCarpetPriceMinor) : "—"}
                  </span>
                </div>
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-navy">
                    Number of Pieces
                  </p>
                  <p className="text-[11px] text-muted">Same dimensions</p>
                </div>
                <div className="flex items-center rounded-lg border border-navy/20 bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="flex h-8 w-8 items-center justify-center text-navy hover:bg-navy/5 disabled:opacity-30"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-semibold text-navy">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-8 w-8 items-center justify-center text-navy hover:bg-navy/5"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {quantity > 1 && isValidDimensions ? (
                <div className="flex items-center justify-between rounded-lg bg-navy/5 px-3 py-2 text-xs font-semibold text-navy">
                  <span>Total for {quantity} carpets:</span>
                  <span className="text-sm font-bold text-red">{formatMoney(totalOrderPriceMinor)}</span>
                </div>
              ) : null}
            </div>
          </div>
        ) : sizeOptions.length > 0 && onSizeChange ? (
          <ProductOptionSelector
            label="Available sizes"
            options={sizeOptions}
            value={selectedSizeId}
            onChange={onSizeChange}
          />
        ) : null}

        {variantId && inStock ? (
          <ProductActions
            variantId={variantId}
            productName={productName}
            className="pt-1"
            customization={
              isCarpet && isValidDimensions
                ? {
                    dimensions: `${numLen} ft × ${numWid} ft`,
                    length: numLen,
                    width: numWid,
                    areaSqFt,
                    unit: "sq ft",
                    ratePerSqFtMinor: effectiveRateMinor,
                    size: `${numLen} ft × ${numWid} ft (${areaSqFt} sq ft)`,
                  }
                : undefined
            }
            quantity={isCarpet ? quantity : 1}
            totalPriceLabel={
              isCarpet && isValidDimensions
                ? formatMoney(totalOrderPriceMinor)
                : undefined
            }
            disabled={isCarpet && (!isValidDimensions || calculatedCarpetPriceMinor <= 0)}
            disabledReason={
              isCarpet && !isValidDimensions
                ? "Please enter valid length and width in feet"
                : undefined
            }
          />
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
