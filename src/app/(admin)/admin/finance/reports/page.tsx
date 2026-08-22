import Link from "next/link";
import { requireAdminPageAccess } from "@/server/admin/page-access";
import { getFinanceDashboardMetrics } from "@/server/finance/metrics";
import { canExportReports } from "@/lib/auth/finance-permissions";
import { AdminPageHeader, StatCard, AdminCard } from "@/components/admin/layout/AdminPageHeader";
import { FinanceSubNav } from "@/components/admin/finance/FinanceSubNav";
import { financeDatePresets } from "@/lib/finance/display";
import { formatMoney } from "@/lib/money";

function buildReportsHref(from?: string, to?: string) {
  const query = new URLSearchParams();
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  const qs = query.toString();
  return qs ? `/admin/finance/reports?${qs}` : "/admin/finance/reports";
}

function buildExportHref(from?: string, to?: string) {
  const query = new URLSearchParams();
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  return `/api/admin/finance/reports/export?${query.toString()}`;
}

export default async function FinanceReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const ctx = await requireAdminPageAccess("financial_reports.view", "finance.read");
  const params = await searchParams;
  const presets = financeDatePresets();

  const metrics = await getFinanceDashboardMetrics({
    from: params.from,
    to: params.to,
  }).catch(() => null);

  const exportAllowed = canExportReports(ctx.permissions);

  return (
    <div>
      <AdminPageHeader
        title="Financial Reports"
        description="Summary metrics for the selected period"
        actions={
          exportAllowed && metrics ? (
            <a
              href={buildExportHref(params.from, params.to)}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90"
            >
              Export CSV
            </a>
          ) : null
        }
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
                href={buildReportsHref(preset.from, preset.to)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  active ? "bg-navy text-white" : "bg-navy/5 text-navy hover:bg-navy/10"
                }`}
              >
                {preset.label}
              </Link>
            );
          })}
          <Link href="/admin/finance/reports" className="rounded-full px-3 py-1.5 text-sm font-medium text-muted hover:bg-navy/5">
            All time
          </Link>
        </div>
      </AdminCard>

      {!metrics ? (
        <AdminCard className="p-6 text-sm text-muted">Reports unavailable — apply finance migration first.</AdminCard>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Gross sales" value={formatMoney(metrics.grossMinor)} />
            <StatCard label="Net sales" value={formatMoney(metrics.netMinor)} />
            <StatCard label="Payments collected" value={formatMoney(metrics.successfulMinor)} />
            <StatCard label="Refunds" value={formatMoney(metrics.refundMinor)} />
            <StatCard label="Fees" value={formatMoney(metrics.feeMinor)} />
            <StatCard label="Taxes" value={formatMoney(metrics.taxMinor)} />
            <StatCard label="Payouts" value={formatMoney(metrics.payoutMinor)} />
            <StatCard label="Failed payments" value={String(metrics.failedCount)} />
            <StatCard label="Pending refunds" value={String(metrics.pendingRefunds)} />
            <StatCard label="Reconciliation gap" value={formatMoney(metrics.outstandingMinor)} />
          </div>

          <AdminCard className="mt-6 p-5">
            <h2 className="text-sm font-semibold text-navy">Report sections</h2>
            <p className="mt-2 text-sm text-muted">
              Taxes and fees are included in this summary. Use Transactions for line-level detail and
              Reconciliation for settlement differences.
            </p>
            <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <li>
                <Link href="/admin/finance/transactions" className="text-navy hover:underline">
                  Payments & transactions →
                </Link>
              </li>
              <li>
                <Link href="/admin/finance/refunds" className="text-navy hover:underline">
                  Refunds →
                </Link>
              </li>
              <li>
                <Link href="/admin/finance/payouts" className="text-navy hover:underline">
                  Payouts →
                </Link>
              </li>
              <li>
                <Link href="/admin/finance/reconciliation" className="text-navy hover:underline">
                  Reconciliation →
                </Link>
              </li>
            </ul>
          </AdminCard>
        </>
      )}
    </div>
  );
}
