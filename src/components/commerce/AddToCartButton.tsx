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
};

export function ProductActions({ variantId, productName, className }: ProductActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"cart" | "buy" | null>(null);
  const [added, setAdded] = useState(false);

  async function handleAddToCart() {
    setLoading("cart");
    try {
      await addItemToCart(variantId);
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
    setLoading("buy");
    try {
      await addItemToCart(variantId);
      router.push("/checkout");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not proceed to checkout");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className={cn("grid gap-3", className)}>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={loading !== null}
        className="w-full rounded-full border border-navy bg-white px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-navy shadow-sm transition hover:bg-navy hover:text-white disabled:opacity-60"
      >
        {loading === "cart" ? "Adding..." : added ? "Added to cart" : "Add to Cart"}
      </button>
      <button
        type="button"
        onClick={handleBuyNow}
        disabled={loading !== null}
        className="w-full rounded-full bg-red px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-lg shadow-red/20 transition hover:bg-red/90 disabled:opacity-60"
      >
        {loading === "buy" ? "Processing..." : "Buy It Now"}
      </button>
    </div>
  );
}

export function AddToCartButton({ variantId }: { variantId: string }) {
  return <ProductActions variantId={variantId} />;
}
