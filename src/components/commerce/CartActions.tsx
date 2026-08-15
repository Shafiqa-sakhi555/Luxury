"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function CartActions({ itemId, quantity }: { itemId: string; quantity: number }) {
  const router = useRouter();
  const [qty, setQty] = useState(quantity);
  const [loading, setLoading] = useState(false);

  async function update(newQty: number) {
    setLoading(true);
    const res = await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ itemId, quantity: newQty }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Could not update quantity");
      return;
    }
    setQty(newQty);
    router.refresh();
  }

  async function remove() {
    setLoading(true);
    await fetch(`/api/cart?itemId=${itemId}`, { method: "DELETE", credentials: "same-origin" });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="mt-3 flex items-center gap-3">
      <button
        type="button"
        disabled={loading || qty <= 1}
        onClick={() => update(qty - 1)}
        className="h-8 w-8 rounded-full border border-navy/10 text-navy"
      >
        −
      </button>
      <span className="w-6 text-center text-sm tabular-nums">{qty}</span>
      <button
        type="button"
        disabled={loading}
        onClick={() => update(qty + 1)}
        className="h-8 w-8 rounded-full border border-navy/10 text-navy"
      >
        +
      </button>
      <button type="button" disabled={loading} onClick={remove} className="text-xs text-red hover:underline">
        Remove
      </button>
    </div>
  );
}
