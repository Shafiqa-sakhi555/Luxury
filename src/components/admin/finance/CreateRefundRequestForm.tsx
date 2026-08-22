"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createRefundRequestAction } from "@/server/finance/actions";
import { formatMoney } from "@/lib/money";

export function CreateRefundRequestForm({
  orderId,
  orderNumber,
  remainingRefundableMinor,
}: {
  orderId: string;
  orderNumber: string;
  remainingRefundableMinor: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [amountMajor, setAmountMajor] = useState(String(remainingRefundableMinor / 100));
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  if (remainingRefundableMinor <= 0) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amountMinor = Math.round(Number(amountMajor) * 100);
    startTransition(async () => {
      const result = await createRefundRequestAction({
        orderId,
        amountMinor,
        reason,
        adminNotes: notes,
        returnStatus: "RETURN_CONFIRMED",
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Refund request sent to finance for approval.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-navy/10 bg-brand-50 p-4">
      <h3 className="text-sm font-semibold text-navy">Request refund (finance approval required)</h3>
      <p className="text-xs text-muted">
        Remaining refundable: {formatMoney(remainingRefundableMinor)} for {orderNumber}
      </p>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Refund amount (PKR)</label>
        <input
          type="number"
          min={1}
          max={remainingRefundableMinor / 100}
          step="1"
          value={amountMajor}
          onChange={(e) => setAmountMajor(e.target.value)}
          className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Reason</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-[72px] w-full rounded-lg border border-navy/15 px-3 py-2 text-sm"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Admin notes (optional)</label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Submit refund request"}
      </button>
    </form>
  );
}
