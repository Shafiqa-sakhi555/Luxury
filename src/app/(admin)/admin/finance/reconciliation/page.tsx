import { requireAdminPageAccess } from "@/server/admin/page-access";
import { listReconciliationRecords } from "@/server/finance/queries";
import { canManageReconciliation } from "@/lib/auth/finance-permissions";
import { AdminPageHeader, AdminCard } from "@/components/admin/layout/AdminPageHeader";
import {
  AdminTable,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableHead,
  AdminTableCell,
  AdminTableEmpty,
  AdminTableToolbar,
  AdminPagination,
} from "@/components/admin/ui";
import { FinanceSubNav } from "@/components/admin/finance/FinanceSubNav";
import { FinanceStatusBadge } from "@/components/admin/finance/FinanceStatusBadge";
import { ReconciliationForm } from "@/components/admin/finance/ReconciliationForm";
import { formatMoney } from "@/lib/money";

function buildHref(page: number) {
  return page > 1 ? `/admin/finance/reconciliation?page=${page}` : "/admin/finance/reconciliation";
}

export default async function FinanceReconciliationPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const ctx = await requireAdminPageAccess("reconciliation.view", "finance.read");
  const params = await searchParams;
  const page = Number(params.page ?? 1);

  const result = await listReconciliationRecords({ page }).catch(() => ({
    items: [],
    total: 0,
    page: 1,
    pageSize: 25,
    totalPages: 0,
  }));

  return (
    <div>
      <AdminPageHeader
        title="Reconciliation"
        description="Compare system totals against recorded COD collections"
      />
      <FinanceSubNav />

      {canManageReconciliation(ctx.permissions) ? (
        <AdminCard className="mb-6 p-5">
          <h2 className="mb-4 text-sm font-semibold text-navy">Record settlement</h2>
          <ReconciliationForm />
        </AdminCard>
      ) : null}

      <AdminCard className="overflow-hidden">
        <AdminTableToolbar>
          <p className="text-sm text-muted">{result.total} reconciliation record{result.total === 1 ? "" : "s"}</p>
        </AdminTableToolbar>
        <AdminTable>
          <AdminTableHeader>
            <tr>
              <AdminTableHead>Settlement</AdminTableHead>
              <AdminTableHead>Expected</AdminTableHead>
              <AdminTableHead>Actual</AdminTableHead>
              <AdminTableHead>Difference</AdminTableHead>
              <AdminTableHead>Status</AdminTableHead>
              <AdminTableHead>Date</AdminTableHead>
            </tr>
          </AdminTableHeader>
          <AdminTableBody>
            {result.items.length === 0 ? (
              <AdminTableEmpty
                colSpan={6}
                title="No reconciliation records"
                description="Record a COD settlement to compare expected vs actual collections."
              />
            ) : (
              result.items.map((row: {
                id: string;
                expected_amount_minor: number;
                actual_amount_minor: number;
                difference_minor: number;
                status: string;
                notes?: string | null;
                reconciled_at?: string | null;
                finance_settlements?: {
                  settlement_number?: string;
                  provider?: string;
                  period_start?: string;
                  period_end?: string;
                } | {
                  settlement_number?: string;
                  provider?: string;
                  period_start?: string;
                  period_end?: string;
                }[] | null;
              }) => {
                const settlement = Array.isArray(row.finance_settlements)
                  ? row.finance_settlements[0]
                  : row.finance_settlements;
                return (
                  <AdminTableRow key={row.id}>
                    <AdminTableCell>
                      <span className="font-medium text-navy">{settlement?.settlement_number ?? "—"}</span>
                      {settlement ? (
                        <span className="block text-xs text-muted">
                          {settlement.period_start} — {settlement.period_end}
                        </span>
                      ) : null}
                      {row.notes ? <span className="block text-xs text-muted">{row.notes}</span> : null}
                    </AdminTableCell>
                    <AdminTableCell className="tabular-nums">{formatMoney(row.expected_amount_minor)}</AdminTableCell>
                    <AdminTableCell className="tabular-nums">{formatMoney(row.actual_amount_minor)}</AdminTableCell>
                    <AdminTableCell className={`tabular-nums ${row.difference_minor !== 0 ? "text-red font-medium" : ""}`}>
                      {formatMoney(row.difference_minor)}
                    </AdminTableCell>
                    <AdminTableCell>
                      <FinanceStatusBadge status={row.status} />
                    </AdminTableCell>
                    <AdminTableCell className="text-muted">
                      {row.reconciled_at ? new Date(row.reconciled_at).toLocaleDateString() : "—"}
                    </AdminTableCell>
                  </AdminTableRow>
                );
              })
            )}
          </AdminTableBody>
        </AdminTable>
        <AdminPagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          pageSize={result.pageSize}
          buildHref={buildHref}
        />
      </AdminCard>
    </div>
  );
}
