"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  approveRefundRequestAction,
  rejectRefundRequestAction,
} from "@/server/finance/actions";
import { formatMoney } from "@/lib/money";

export function RefundApprovalPanel({
  refundId,
  requestedAmountMinor,
  orderNumber,
  canApprove,
}: {
  refundId: string;
  requestedAmountMinor: number;
  orderNumber: string;
  canApprove: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rejectReason, setRejectReason] = useState("");
  const [financeNotes, setFinanceNotes] = useState("");
  const [showReject, setShowReject] = useState(false);

  if (!canApprove) {
    return (
      <p className="text-sm text-muted">
        You have read-only access. Contact finance to approve or reject this refund.
      </p>
    );
  }

  function approve() {
    if (!confirm(`Approve refund of ${formatMoney(requestedAmountMinor)} for order ${orderNumber}?`)) {
      return;
    }
    startTransition(async () => {
      const result = await approveRefundRequestAction({
        refundId,
        approvedAmountMinor: requestedAmountMinor,
        financeNotes,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Refund approved and recorded.");
      router.refresh();
    });
  }

  function reject() {
    if (!rejectReason.trim()) {
      toast.error("Enter a rejection reason.");
      return;
    }
    startTransition(async () => {
      const result = await rejectRefundRequestAction({ refundId, rejectionReason: rejectReason });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Refund rejected.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
          Finance notes (optional)
        </label>
        <textarea
          value={financeNotes}
          onChange={(e) => setFinanceNotes(e.target.value)}
          className="min-h-[80px] w-full rounded-lg border border-navy/15 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={approve}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Processing…" : "Approve refund"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setShowReject((v) => !v)}
          className="rounded-lg border border-red/30 px-4 py-2 text-sm font-medium text-red hover:bg-red/5"
        >
          Reject
        </button>
      </div>
      {showReject ? (
        <div className="space-y-2 rounded-lg border border-red/20 bg-red/5 p-4">
          <label className="block text-xs font-medium uppercase tracking-wide text-red">
            Rejection reason
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[80px] w-full rounded-lg border border-navy/15 px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={pending}
            onClick={reject}
            className="rounded-lg bg-red px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Confirm rejection
          </button>
        </div>
      ) : null}
    </div>
  );
}
