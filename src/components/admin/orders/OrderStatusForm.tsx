"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateOrderStatusAction } from "@/server/orders/admin-actions";
import { ORDER_STATUS_OPTIONS } from "@/lib/auth/admin-access";
import { AdminSelect } from "@/components/admin/ui";

export function OrderStatusForm({
  orderId,
  currentStatus,
  canEdit,
}: {
  orderId: string;
  currentStatus: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canEdit) {
    return (
      <p className="text-sm text-muted">
        You have read-only access to orders. Contact an admin to confirm or update status.
      </p>
    );
  }

  function submitStatus(nextStatus: string, nextReason?: string) {
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatusAction({
        orderId,
        status: nextStatus,
        reason: nextReason?.trim() || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setStatus(nextStatus);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {currentStatus === "PENDING" ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">This order is waiting for confirmation.</p>
          <p className="mt-1 text-sm text-amber-800">
            Confirm it after verifying the customer details and COD order. The customer will see
            &quot;Confirmed&quot; in their account.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() => submitStatus("CONFIRMED", reason.trim() || "Order confirmed by admin")}
            className="mt-3 inline-flex h-9 items-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? "Confirming…" : "Confirm order"}
          </button>
        </div>
      ) : null}

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          submitStatus(status, reason);
        }}
      >
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
            Status
          </label>
          <AdminSelect value={status} onChange={(event) => setStatus(event.target.value)}>
            {ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </AdminSelect>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
            Note (optional)
          </label>
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm"
            placeholder="Reason for status change"
          />
        </div>
        {error ? <p className="text-sm text-red">{error}</p> : null}
        <button
          type="submit"
          disabled={pending || status === currentStatus}
          className="inline-flex h-9 items-center rounded-lg bg-navy px-4 text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Update status"}
        </button>
      </form>
    </div>
  );
}
