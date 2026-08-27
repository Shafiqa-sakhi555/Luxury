"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { cancelCustomerOrderAction } from "@/server/orders/customer-actions";
import { cn } from "@/lib/utils";

export function CancelOrderButton({
  orderId,
  orderNumber,
  className,
}: {
  orderId: string;
  orderNumber: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onCancel() {
    const confirmed = window.confirm(
      `Cancel order ${orderNumber}? It will not be delivered and cash on delivery will not be collected.`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await cancelCustomerOrderAction({ orderId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Order cancelled.");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onCancel}
      disabled={pending}
      className={cn(
        "inline-flex items-center justify-center border border-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red transition hover:bg-red hover:text-white disabled:opacity-60",
        className
      )}
    >
      {pending ? "Cancelling…" : "Cancel order"}
    </button>
  );
}
