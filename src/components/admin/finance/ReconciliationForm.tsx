"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createCodSettlementAction } from "@/server/finance/actions";
import { AdminInput, AdminLabel } from "@/components/admin/ui";

export function ReconciliationForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [periodStart, setPeriodStart] = useState(monthStart);
  const [periodEnd, setPeriodEnd] = useState(today);
  const [actualMajor, setActualMajor] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const actualAmountMinor = Math.round(Number(actualMajor) * 100);
    if (!actualAmountMinor && actualAmountMinor !== 0) {
      toast.error("Enter the actual settlement amount.");
      return;
    }
    if (!confirm(`Record COD settlement for ${periodStart} to ${periodEnd}?`)) return;

    startTransition(async () => {
      const result = await createCodSettlementAction({
        periodStart,
        periodEnd,
        actualAmountMinor,
        settlementReference: reference || undefined,
        notes: notes || undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Settlement and reconciliation record created.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted">
        Record cash-on-delivery collections against system totals. No payment gateway API is configured —
        enter the amount you actually received.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <AdminLabel htmlFor="periodStart">Period start</AdminLabel>
          <AdminInput
            id="periodStart"
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            required
          />
        </div>
        <div>
          <AdminLabel htmlFor="periodEnd">Period end</AdminLabel>
          <AdminInput
            id="periodEnd"
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            required
          />
        </div>
        <div>
          <AdminLabel htmlFor="actual">Actual settlement (PKR)</AdminLabel>
          <AdminInput
            id="actual"
            type="number"
            min={0}
            step="1"
            value={actualMajor}
            onChange={(e) => setActualMajor(e.target.value)}
            required
          />
        </div>
        <div>
          <AdminLabel htmlFor="reference">Reference (optional)</AdminLabel>
          <AdminInput
            id="reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Bank deposit ref"
          />
        </div>
      </div>
      <div>
        <AdminLabel htmlFor="notes">Notes (optional)</AdminLabel>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[72px] w-full rounded-lg border border-navy/10 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Record settlement"}
      </button>
    </form>
  );
}
