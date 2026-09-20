"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addItemToCart } from "@/lib/cart-client";
import { cn } from "@/lib/utils";

type ProductActionsProps = {
  variantId: string;
  productName?: string;
  className?: string;
  customization?: Record<string, unknown>;
  quantity?: number;
  totalPriceLabel?: string;
  disabled?: boolean;
  disabledReason?: string;
};

export function ProductActions({
  variantId,
  productName,
  className,
  customization,
  quantity = 1,
  totalPriceLabel,
  disabled = false,
  disabledReason,
}: ProductActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"cart" | "buy" | null>(null);
  const [added, setAdded] = useState(false);

  const isButtonDisabled = disabled || loading !== null;

  async function handleAddToCart() {
    if (disabled) {
      if (disabledReason) toast.error(disabledReason);
      return;
    }
    setLoading("cart");
    try {
      await addItemToCart(variantId, quantity, customization);
      setAdded(true);
      toast.success("Added to cart", {
        description: productName,
        action: {
          label: "View cart",
          onClick: () => router.push("/cart"),
        },
      });
      router.refresh();
      window.setTimeout(() => setAdded(false), 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add to cart");
    } finally {
      setLoading(null);
    }
  }

  async function handleBuyNow() {
    if (disabled) {
      if (disabledReason) toast.error(disabledReason);
      return;
    }
    setLoading("buy");
    try {
      await addItemToCart(variantId, quantity, customization);
      router.push("/checkout");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not proceed to checkout");
    } finally {
      setLoading(null);
    }
  }

  const addLabel = loading === "cart"
    ? "Adding..."
    : added
    ? "Added to cart"
    : totalPriceLabel
    ? `Add to Cart · ${totalPriceLabel}`
    : "Add to Cart";

  const buyLabel = loading === "buy"
    ? "Processing..."
    : totalPriceLabel
    ? `Buy It Now · ${totalPriceLabel}`
    : "Buy It Now";

  return (
    <div className={cn("grid gap-3", className)}>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isButtonDisabled}
        className="w-full rounded-full border border-navy bg-white px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-navy shadow-sm transition hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {addLabel}
      </button>
      <button
        type="button"
        onClick={handleBuyNow}
        disabled={isButtonDisabled}
        className="w-full rounded-full bg-red px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-lg shadow-red/20 transition hover:bg-red/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {buyLabel}
      </button>
      {disabled && disabledReason ? (
        <p className="text-center text-xs text-amber-800">{disabledReason}</p>
      ) : null}
    </div>
  );
}

export function AddToCartButton({ variantId }: { variantId: string }) {
  return <ProductActions variantId={variantId} />;
}
