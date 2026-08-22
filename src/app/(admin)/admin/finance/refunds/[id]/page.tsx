import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPageAccess } from "@/server/admin/page-access";
import { getRefundRequestById } from "@/server/finance/queries";
import { canApproveRefunds } from "@/lib/auth/finance-permissions";
import { AdminPageHeader, AdminCard } from "@/components/admin/layout/AdminPageHeader";
import { FinanceSubNav } from "@/components/admin/finance/FinanceSubNav";
import { FinanceStatusBadge } from "@/components/admin/finance/FinanceStatusBadge";
import { RefundApprovalPanel } from "@/components/admin/finance/RefundApprovalPanel";
import { profileFromJoin, orderNumberFromJoin } from "@/lib/finance/display";
import { formatMoney } from "@/lib/money";

export default async function FinanceRefundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAdminPageAccess("refunds.view", "finance.read");
  const { id } = await params;
  const refund = await getRefundRequestById(id).catch(() => null);

  if (!refund) notFound();

  const order = Array.isArray(refund.orders) ? refund.orders[0] : refund.orders;
  const txn = Array.isArray(refund.financial_transactions)
    ? refund.financial_transactions[0]
    : refund.financial_transactions;
  const customer = profileFromJoin(refund.customers?.profiles as never);
  const alreadyRefunded = txn?.refund_amount_minor ?? 0;
  const originalAmount = txn?.amount_minor ?? refund.original_amount_minor;
  const remaining = Math.max(0, originalAmount - alreadyRefunded);

  return (
    <div>
      <AdminPageHeader
        title={refund.refund_number}
        description={`Refund request for order ${orderNumberFromJoin(refund.orders as never)}`}
        actions={
          <Link href="/admin/finance/refunds" className="text-sm text-navy hover:underline">
            Back to refunds
          </Link>
        }
      />
      <FinanceSubNav />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <AdminCard className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-navy">Refund details</h2>
              <FinanceStatusBadge status={refund.status} />
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Requested amount</dt>
                <dd className="font-medium tabular-nums text-navy">
                  {formatMoney(refund.requested_amount_minor)}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Original payment</dt>
                <dd className="font-medium tabular-nums">{formatMoney(originalAmount)}</dd>
              </div>
              <div>
                <dt className="text-muted">Already refunded</dt>
                <dd className="font-medium tabular-nums">{formatMoney(alreadyRefunded)}</dd>
              </div>
              <div>
                <dt className="text-muted">Remaining refundable</dt>
                <dd className="font-medium tabular-nums">{formatMoney(remaining)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted">Reason</dt>
                <dd>{refund.reason}</dd>
              </div>
              {refund.admin_notes ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted">Admin notes</dt>
                  <dd>{refund.admin_notes}</dd>
                </div>
              ) : null}
              {refund.rejection_reason ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted">Rejection reason</dt>
                  <dd className="text-red">{refund.rejection_reason}</dd>
                </div>
              ) : null}
              {refund.provider_reference ? (
                <div>
                  <dt className="text-muted">Provider reference</dt>
                  <dd>{refund.provider_reference}</dd>
                </div>
              ) : null}
              {refund.provider_result ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted">Provider result</dt>
                  <dd>{refund.provider_result}</dd>
                </div>
              ) : null}
            </dl>
          </AdminCard>

          {refund.status === "PENDING_FINANCE" ? (
            <AdminCard className="p-5">
              <h2 className="mb-4 text-sm font-semibold text-navy">Finance approval</h2>
              <RefundApprovalPanel
                refundId={refund.id}
                requestedAmountMinor={refund.requested_amount_minor}
                orderNumber={order?.order_number ?? "—"}
                canApprove={canApproveRefunds(ctx.permissions)}
              />
            </AdminCard>
          ) : null}
        </div>

        <div className="space-y-6">
          <AdminCard className="space-y-2 p-5 text-sm">
            <h2 className="font-semibold text-navy">Customer</h2>
            <p>{customer.label}</p>
            {customer.email ? <p className="text-muted">{customer.email}</p> : null}
          </AdminCard>

          <AdminCard className="space-y-2 p-5 text-sm">
            <h2 className="font-semibold text-navy">Payment</h2>
            {txn ? (
              <>
                <p>{txn.transaction_number}</p>
                <p className="text-muted">{txn.payment_method} · {txn.payment_provider}</p>
                <FinanceStatusBadge status={txn.payment_status} />
              </>
            ) : (
              <p className="text-muted">No linked transaction.</p>
            )}
          </AdminCard>

          {order ? (
            <AdminCard className="p-5 text-sm">
              <h2 className="font-semibold text-navy">Order</h2>
              <Link href={`/admin/orders/${order.id}`} className="mt-2 inline-block font-medium text-navy hover:underline">
                {order.order_number}
              </Link>
              <p className="mt-2 tabular-nums">{formatMoney(order.total_minor)}</p>
            </AdminCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}
