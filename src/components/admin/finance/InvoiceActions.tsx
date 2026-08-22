"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { sendInvoiceEmailAction } from "@/server/finance/actions";

export function InvoiceActions({
  invoiceId,
  canSend,
}: {
  invoiceId: string;
  canSend: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function printInvoice() {
    window.print();
  }

  function sendInvoice() {
    if (!confirm("Send this invoice to the customer by email?")) return;
    startTransition(async () => {
      const result = await sendInvoiceEmailAction(invoiceId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Invoice sent to customer.");
    });
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button
        type="button"
        onClick={printInvoice}
        className="rounded-lg border border-navy/15 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5"
      >
        Download / Print
      </button>
      {canSend ? (
        <button
          type="button"
          disabled={pending}
          onClick={sendInvoice}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send to customer"}
        </button>
      ) : null}
    </div>
  );
}
