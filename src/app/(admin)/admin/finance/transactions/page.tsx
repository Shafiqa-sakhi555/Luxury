import { Suspense } from "react";
import { requireAdminPageAccess } from "@/server/admin/page-access";
import { listFinancialTransactions } from "@/server/finance/queries";
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
import { FinanceFilterBar } from "@/components/admin/finance/FinanceFilterBar";
import { FinanceStatusBadge } from "@/components/admin/finance/FinanceStatusBadge";
import { profileFromJoin, orderNumberFromJoin } from "@/lib/finance/display";
import { formatMoney } from "@/lib/money";

function buildHref(params: Record<string, string | undefined>, page: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  if (page > 1) query.set("page", String(page));
  const qs = query.toString();
  return qs ? `/admin/finance/transactions?${qs}` : "/admin/finance/transactions";
}

export default async function FinanceTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    paymentMethod?: string;
    provider?: string;
    from?: string;
    to?: string;
  }>;
}) {
  await requireAdminPageAccess("transactions.view", "payments.view", "finance.read");
  const params = await searchParams;
  const page = Number(params.page ?? 1);

  const result = await listFinancialTransactions({
    page,
    search: params.search,
    status: params.status,
    paymentMethod: params.paymentMethod,
    provider: params.provider,
    from: params.from,
    to: params.to,
  }).catch(() => ({ items: [], total: 0, page: 1, pageSize: 25, totalPages: 0 }));

  return (
    <div>
      <AdminPageHeader title="Transactions" description="Order payments and financial transactions" />
      <FinanceSubNav />

      <AdminCard className="mb-4 p-4">
        <Suspense fallback={null}>
          <FinanceFilterBar
            basePath="/admin/finance/transactions"
            fields={[
              { name: "search", label: "Search", placeholder: "Transaction or order #" },
              {
                name: "status",
                label: "Status",
                type: "select",
                options: [
                  { value: "PENDING", label: "Pending" },
                  { value: "SUCCESSFUL", label: "Successful" },
                  { value: "FAILED", label: "Failed" },
                  { value: "CANCELLED", label: "Cancelled" },
                  { value: "REFUNDED", label: "Refunded" },
                  { value: "PARTIALLY_REFUNDED", label: "Partially refunded" },
                ],
              },
              { name: "paymentMethod", label: "Method", placeholder: "COD" },
              { name: "provider", label: "Provider", placeholder: "cod" },
              { name: "from", label: "From", type: "date" },
              { name: "to", label: "To", type: "date" },
            ]}
          />
        </Suspense>
      </AdminCard>

      <AdminCard className="overflow-hidden">
        <AdminTableToolbar>
          <p className="text-sm text-muted">{result.total} transaction{result.total === 1 ? "" : "s"}</p>
        </AdminTableToolbar>
        <AdminTable>
          <AdminTableHeader>
            <tr>
              <AdminTableHead>Transaction</AdminTableHead>
              <AdminTableHead>Order</AdminTableHead>
              <AdminTableHead>Customer</AdminTableHead>
              <AdminTableHead>Amount</AdminTableHead>
              <AdminTableHead>Net</AdminTableHead>
              <AdminTableHead>Method</AdminTableHead>
              <AdminTableHead>Status</AdminTableHead>
              <AdminTableHead>Date</AdminTableHead>
            </tr>
          </AdminTableHeader>
          <AdminTableBody>
            {result.items.length === 0 ? (
              <AdminTableEmpty colSpan={8} title="No transactions" description="Transactions appear when orders are placed." />
            ) : (
              result.items.map((txn: {
                id: string;
                transaction_number: string;
                amount_minor: number;
                net_amount_minor: number;
                refund_amount_minor: number;
                gateway_fee_minor: number;
                payment_method: string;
                payment_provider: string;
                payment_status: string;
                transaction_date: string;
                failure_reason?: string | null;
                orders?: unknown;
                customers?: { profiles?: unknown };
              }) => (
                <AdminTableRow key={txn.id}>
                  <AdminTableCell className="font-medium text-navy">{txn.transaction_number}</AdminTableCell>
                  <AdminTableCell>{orderNumberFromJoin(txn.orders as never)}</AdminTableCell>
                  <AdminTableCell className="text-muted">
                    {profileFromJoin(txn.customers?.profiles as never).label}
                  </AdminTableCell>
                  <AdminTableCell className="tabular-nums">{formatMoney(txn.amount_minor)}</AdminTableCell>
                  <AdminTableCell className="tabular-nums">{formatMoney(txn.net_amount_minor)}</AdminTableCell>
                  <AdminTableCell className="text-muted">
                    {txn.payment_method}
                    {txn.gateway_fee_minor > 0 ? (
                      <span className="block text-xs">Fee {formatMoney(txn.gateway_fee_minor)}</span>
                    ) : null}
                  </AdminTableCell>
                  <AdminTableCell>
                    <FinanceStatusBadge status={txn.payment_status} />
                    {txn.failure_reason ? (
                      <p className="mt-1 max-w-[160px] truncate text-xs text-red" title={txn.failure_reason}>
                        {txn.failure_reason}
                      </p>
                    ) : null}
                  </AdminTableCell>
                  <AdminTableCell className="text-muted">
                    {new Date(txn.transaction_date).toLocaleDateString()}
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
          buildHref={(p) => buildHref(params, p)}
        />
      </AdminCard>
    </div>
  );
}
