import { requireAdminPageAccess } from "@/server/admin/page-access";
import { listSettlements } from "@/server/finance/queries";
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
import { formatMoney } from "@/lib/money";

function buildHref(page: number) {
  return page > 1 ? `/admin/finance/payouts?page=${page}` : "/admin/finance/payouts";
}

export default async function FinancePayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdminPageAccess("payouts.view", "settlements.view", "finance.read");
  const params = await searchParams;
  const page = Number(params.page ?? 1);

  const result = await listSettlements({ page }).catch(() => ({
    items: [],
    total: 0,
    page: 1,
    pageSize: 25,
    totalPages: 0,
  }));

  return (
    <div>
      <AdminPageHeader
        title="Payouts"
        description="COD settlement batches — no payment gateway payouts are configured"
      />
      <FinanceSubNav />

      <AdminCard className="mb-4 border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Settlements are recorded manually when finance reconciles cash collections. Gateway payout APIs are
        not connected for this store.
      </AdminCard>

      <AdminCard className="overflow-hidden">
        <AdminTableToolbar>
          <p className="text-sm text-muted">{result.total} settlement{result.total === 1 ? "" : "s"}</p>
        </AdminTableToolbar>
        <AdminTable>
          <AdminTableHeader>
            <tr>
              <AdminTableHead>Settlement</AdminTableHead>
              <AdminTableHead>Provider</AdminTableHead>
              <AdminTableHead>Period</AdminTableHead>
              <AdminTableHead>Gross</AdminTableHead>
              <AdminTableHead>Fees</AdminTableHead>
              <AdminTableHead>Refunds</AdminTableHead>
              <AdminTableHead>Net payout</AdminTableHead>
              <AdminTableHead>Status</AdminTableHead>
            </tr>
          </AdminTableHeader>
          <AdminTableBody>
            {result.items.length === 0 ? (
              <AdminTableEmpty
                colSpan={8}
                title="No payouts yet"
                description="Create a settlement from the Reconciliation page when you record COD collections."
                action={{ label: "Go to reconciliation", href: "/admin/finance/reconciliation" }}
              />
            ) : (
              result.items.map((row: {
                id: string;
                settlement_number: string;
                provider: string;
                period_start: string;
                period_end: string;
                gross_amount_minor: number;
                fee_amount_minor: number;
                refund_amount_minor: number;
                net_amount_minor: number;
                status: string;
                settlement_reference?: string | null;
              }) => (
                <AdminTableRow key={row.id}>
                  <AdminTableCell className="font-medium text-navy">
                    {row.settlement_number}
                    {row.settlement_reference ? (
                      <span className="block text-xs text-muted">{row.settlement_reference}</span>
                    ) : null}
                  </AdminTableCell>
                  <AdminTableCell className="uppercase text-muted">{row.provider}</AdminTableCell>
                  <AdminTableCell className="text-muted">
                    {row.period_start} — {row.period_end}
                  </AdminTableCell>
                  <AdminTableCell className="tabular-nums">{formatMoney(row.gross_amount_minor)}</AdminTableCell>
                  <AdminTableCell className="tabular-nums">{formatMoney(row.fee_amount_minor)}</AdminTableCell>
                  <AdminTableCell className="tabular-nums">{formatMoney(row.refund_amount_minor)}</AdminTableCell>
                  <AdminTableCell className="tabular-nums font-medium">{formatMoney(row.net_amount_minor)}</AdminTableCell>
                  <AdminTableCell>
                    <FinanceStatusBadge status={row.status} />
                  </AdminTableCell>
                </AdminTableRow>
              ))
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
