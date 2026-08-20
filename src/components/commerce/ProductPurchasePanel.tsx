"use client";

import { MessageCircle } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { Card } from "@/components/ui/card";
import { AddToCartButton } from "@/components/commerce/AddToCartButton";
import { StockBadge } from "@/components/commerce/StockBadge";
import { OpenAssistantButton } from "@/components/assistant/OpenAssistantButton";

type ProductPurchasePanelProps = {
  salePriceMinor: number;
  originalPriceMinor: number;
  discountPercentage: number;
  priceSubtitle?: string;
  sellingUnit?: string | null;
  sku?: string | null;
  stockStatus?: string | null;
  variantId?: string | null;
  productName: string;
  assistantPrompt?: string;
};

export function ProductPurchasePanel({
  salePriceMinor,
  originalPriceMinor,
  discountPercentage,
  priceSubtitle,
  sellingUnit,
  sku,
  stockStatus,
  variantId,
  productName,
  assistantPrompt,
}: ProductPurchasePanelProps) {
  const hasDiscount = originalPriceMinor > salePriceMinor;
  const inStock =
    stockStatus === "in_stock" ||
    stockStatus === "unknown" ||
    stockStatus === null ||
    stockStatus === undefined;

  return (
    <Card padding="lg" className="space-y-6">
      <div>
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="font-display text-3xl font-medium text-navy sm:text-4xl">
            {formatMoney(salePriceMinor)}
          </span>
          {hasDiscount ? (
            <>
              <span className="text-lg text-muted line-through">
                {formatMoney(originalPriceMinor)}
              </span>
              <span className="rounded-md bg-red px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
                Save {Math.round(discountPercentage)}%
              </span>
            </>
          ) : null}
        </div>
        {(priceSubtitle || sellingUnit) && (
          <p className="mt-2 text-sm text-muted">
            {[priceSubtitle, sellingUnit].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-navy/10 pt-5">
        <StockBadge status={stockStatus} />
        {sku ? <span className="text-xs text-muted">SKU: {sku}</span> : null}
      </div>

      {variantId && inStock ? (
        <AddToCartButton variantId={variantId} />
      ) : !inStock ? (
        <div className="rounded-xl bg-mist px-4 py-3 text-sm text-muted">
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

      <OpenAssistantButton
        variant="outline"
        size="lg"
        prompt={
          assistantPrompt ??
          `Tell me about ${productName} — sizing, fabric, and whether it fits my room.`
        }
        className="w-full border-navy/15"
      >
        <MessageCircle className="h-4 w-4" />
        Ask Jalal Assistance
      </OpenAssistantButton>
    </Card>
  );
}
