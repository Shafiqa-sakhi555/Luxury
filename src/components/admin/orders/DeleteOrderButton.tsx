"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { deleteOrderAction } from "@/server/orders/admin-actions";

export function DeleteOrderButton({
  orderId,
  orderNumber,
}: {
  orderId: string;
  orderNumber: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    const result = await deleteOrderAction(orderId);
    setLoading(false);
    setConfirming(false);

    if (result.ok) {
      toast.success(`Order ${orderNumber} deleted`);
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete order");
    }
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {loading ? "Deleting…" : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      title={`Delete order ${orderNumber}`}
      className="rounded p-1.5 text-neutral-400 transition hover:bg-red-50 hover:text-red-600"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
