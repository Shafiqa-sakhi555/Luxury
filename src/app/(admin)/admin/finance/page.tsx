import Link from "next/link";
import { requireAdminPageAccess } from "@/server/admin/page-access";
import { getFinanceDashboardMetrics } from "@/server/finance/metrics";
import { listRefundRequests } from "@/server/finance/queries";
import { AdminPageHeader, StatCard, AdminCard } from "@/components/admin/layout/AdminPageHeader";
import { FinanceSubNav } from "@/components/admin/finance/FinanceSubNav";
import { FinanceMiniChart, FinanceBreakdownChart } from "@/components/admin/finance/FinanceMiniChart";
import { FinanceStatusBadge } from "@/components/admin/finance/FinanceStatusBadge";
import { financeDatePresets } from "@/lib/finance/display";
import { formatMoney } from "@/lib/money";

function buildFinanceHref(from?: string, to?: string) {
  const query = new URLSearchParams();
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  const qs = query.toString();
  return qs ? `/admin/finance?${qs}` : "/admin/finance";
}

export default async function FinanceDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireAdminPageAccess("finance.read", "finance.dashboard.view");
  const params = await searchParams;

  const metrics = await getFinanceDashboardMetrics({
    from: params.from,
    to: params.to,
  }).catch(() => null);

  const pendingRefunds = await listRefundRequests({
    status: "PENDING_FINANCE",
    pageSize: 5,
  }).catch(() => ({ items: [], total: 0 }));

  const presets = financeDatePresets();

  return (
    <div>
      <AdminPageHeader
        title="Finance Dashboard"
        description="Financial snapshot — cash on delivery collections and refund workflow"
      />
      <FinanceSubNav />

      <AdminCard className="mb-6 p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">Date range</p>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => {
            const active = params.from === preset.from && params.to === preset.to;
            return (
              <Link
                key={preset.label}
                href={buildFinanceHref(preset.from, preset.to)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  active ? "bg-navy text-white" : "bg-navy/5 text-navy hover:bg-navy/10"
                }`}
              >
                {preset.label}
              </Link>
            );
          })}
          <Link
            href="/admin/finance"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-muted hover:bg-navy/5"
          >
            All time
          </Link>
        </div>
      </AdminCard>

      {!metrics ? (
        <AdminCard className="p-6 text-sm text-muted">
          Finance tables are not available yet. Run{" "}
          <code className="rounded bg-navy/5 px-1">npm run supabase:migrate</code> to apply migration
          009.
        </AdminCard>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Gross sales" value={formatMoney(metrics.grossMinor)} />
            <StatCard label="Net sales" value={formatMoney(metrics.netMinor)} />
            <StatCard label="Total payments" value={formatMoney(metrics.successfulMinor)} />
            <StatCard label="Refunds" value={formatMoney(metrics.refundMinor)} />
            <StatCard label="Payment fees" value={formatMoney(metrics.feeMinor)} />
            <StatCard label="Taxes" value={formatMoney(metrics.taxMinor)} />
            <StatCard label="Payouts" value={formatMoney(metrics.payoutMinor)} />
            <StatCard
              label="Pending refunds"
              value={String(metrics.pendingRefunds)}
              hint="awaiting finance approval"
            />
            <StatCard label="Failed payments" value={String(metrics.failedCount)} />
            <StatCard label="Pending settlements" value={String(metrics.pendingCount)} />
            <StatCard
              label="Outstanding"
              value={formatMoney(metrics.outstandingMinor)}
              hint="unreconciled difference"
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <AdminCard className="p-5">
              <FinanceMiniChart title="Sales over time" series={metrics.salesSeries} valueKey="gross" />
            </AdminCard>
            <AdminCard className="p-5">
              <FinanceMiniChart title="Net revenue" series={metrics.salesSeries} valueKey="net" />
            </AdminCard>
            <AdminCard className="p-5">
              <FinanceMiniChart title="Refunds over time" series={metrics.salesSeries} valueKey="refunds" />
            </AdminCard>
            <AdminCard className="p-5">
              <FinanceBreakdownChart
                title="Payment success vs failure"
                items={[
                  { label: "Successful", value: metrics.paymentStatusBreakdown.successful },
                  { label: "Pending", value: metrics.paymentStatusBreakdown.pending },
                  { label: "Failed", value: metrics.paymentStatusBreakdown.failed },
                  { label: "Refunded", value: metrics.paymentStatusBreakdown.refunded },
                ]}
              />
            </AdminCard>
          </div>

          <AdminCard className="mt-6 overflow-hidden">
            <div className="border-b border-navy/10 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-navy">Refunds awaiting approval</h2>
                <Link href="/admin/finance/refunds?status=PENDING_FINANCE" className="text-xs font-medium text-navy hover:underline">
                  View all
                </Link>
              </div>
            </div>
            {pendingRefunds.items.length === 0 ? (
              <p className="p-5 text-sm text-muted">No refunds pending finance approval.</p>
            ) : (
              <ul className="divide-y divide-navy/10">
                {pendingRefunds.items.map((refund: {
                  id: string;
                  refund_number: string;
                  requested_amount_minor: number;
                  orders?: { order_number?: string } | { order_number?: string }[] | null;
                }) => {
                  const order = Array.isArray(refund.orders) ? refund.orders[0] : refund.orders;
                  return (
                    <li key={refund.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                      <div>
                        <Link href={`/admin/finance/refunds/${refund.id}`} className="font-medium text-navy hover:underline">
                          {refund.refund_number}
                        </Link>
                        <p className="text-xs text-muted">Order {order?.order_number ?? "—"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="tabular-nums">{formatMoney(refund.requested_amount_minor)}</span>
                        <FinanceStatusBadge status="PENDING_FINANCE" />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </AdminCard>
        </>
      )}
    </div>
  );
}
