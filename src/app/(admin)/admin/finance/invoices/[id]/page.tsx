import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPageAccess } from "@/server/admin/page-access";
import { getInvoiceById } from "@/server/finance/queries";
import { AdminPageHeader, AdminCard } from "@/components/admin/layout/AdminPageHeader";
import { FinanceSubNav } from "@/components/admin/finance/FinanceSubNav";
import { FinanceStatusBadge } from "@/components/admin/finance/FinanceStatusBadge";
import { InvoiceActions } from "@/components/admin/finance/InvoiceActions";
import { profileFromJoin } from "@/lib/finance/display";
import { formatMoney } from "@/lib/money";

export default async function FinanceInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPageAccess("invoices.view", "finance.read");
  const { id } = await params;
  const invoice = await getInvoiceById(id).catch(() => null);

  if (!invoice) notFound();

  const order = Array.isArray(invoice.orders) ? invoice.orders[0] : invoice.orders;
  const customer = profileFromJoin(invoice.customers?.profiles as never);
  const items = order?.order_items ?? [];

  return (
    <div className="print:bg-white">
      <div className="print:hidden">
        <AdminPageHeader
          title={invoice.invoice_number}
          description={`Invoice for order ${order?.order_number ?? "—"}`}
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <InvoiceActions invoiceId={invoice.id} canSend />
              <Link href="/admin/finance/invoices" className="text-sm text-navy hover:underline">
                Back to invoices
              </Link>
            </div>
          }
        />
        <FinanceSubNav />
      </div>

      <AdminCard className="mx-auto max-w-3xl p-8 print:border-0 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-navy/10 pb-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Invoice</p>
            <h1 className="font-display text-2xl text-navy">{invoice.invoice_number}</h1>
            <p className="mt-1 text-sm text-muted">
              Issued {new Date(invoice.issued_at).toLocaleDateString()}
              {invoice.due_at ? ` · Due ${new Date(invoice.due_at).toLocaleDateString()}` : ""}
            </p>
          </div>
          <FinanceStatusBadge status={invoice.payment_status} />
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 text-sm">
          <div>
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Bill to</h2>
            <p className="mt-2 font-medium text-navy">{customer.label}</p>
            {customer.email ? <p className="text-muted">{customer.email}</p> : null}
            {order?.shipping_line1 ? (
              <>
                <p className="mt-2 text-muted">{order.shipping_line1}</p>
                <p className="text-muted">
                  {[order.shipping_city, order.shipping_region, order.shipping_postal].filter(Boolean).join(", ")}
                </p>
                {order.shipping_phone ? <p className="text-muted">{order.shipping_phone}</p> : null}
              </>
            ) : null}
          </div>
          <div>
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Order</h2>
            <p className="mt-2 font-medium text-navy">{order?.order_number ?? "—"}</p>
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-left text-xs uppercase tracking-wide text-muted">
              <th className="pb-2">Item</th>
              <th className="pb-2">Qty</th>
              <th className="pb-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: {
              id: string;
              product_name: string;
              quantity: number;
              line_total_minor: number;
            }) => (
              <tr key={item.id} className="border-b border-navy/5">
                <td className="py-3">{item.product_name}</td>
                <td className="py-3 tabular-nums">{item.quantity}</td>
                <td className="py-3 text-right tabular-nums">{formatMoney(item.line_total_minor)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <span className="tabular-nums">{formatMoney(invoice.subtotal_minor)}</span>
          </div>
          {invoice.discount_minor > 0 ? (
            <div className="flex justify-between">
              <span className="text-muted">Discount</span>
              <span className="tabular-nums">-{formatMoney(invoice.discount_minor)}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="text-muted">Shipping</span>
            <span className="tabular-nums">{formatMoney(invoice.delivery_minor)}</span>
          </div>
          {invoice.tax_minor > 0 ? (
            <div className="flex justify-between">
              <span className="text-muted">Tax</span>
              <span className="tabular-nums">{formatMoney(invoice.tax_minor)}</span>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-navy/10 pt-2 font-semibold text-navy">
            <span>Total</span>
            <span className="tabular-nums">{formatMoney(invoice.total_minor)}</span>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
