import Link from "next/link";
import { Suspense } from "react";
import { requireAdminPageAccess } from "@/server/admin/page-access";
import { listRefundRequests } from "@/server/finance/queries";
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
  return qs ? `/admin/finance/refunds?${qs}` : "/admin/finance/refunds";
}

export default async function FinanceRefundsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string; from?: string; to?: string }>;
}) {
  await requireAdminPageAccess("refunds.view", "finance.read");
  const params = await searchParams;
  const page = Number(params.page ?? 1);

  const result = await listRefundRequests({
    page,
    search: params.search,
    status: params.status,
    from: params.from,
    to: params.to,
  }).catch(() => ({ items: [], total: 0, page: 1, pageSize: 25, totalPages: 0 }));

  return (
    <div>
      <AdminPageHeader title="Refunds" description="Review and approve refund requests" />
      <FinanceSubNav />

      <AdminCard className="mb-4 p-4">
        <Suspense fallback={null}>
          <FinanceFilterBar
            basePath="/admin/finance/refunds"
            fields={[
              { name: "search", label: "Search", placeholder: "Refund or order #" },
              {
                name: "status",
                label: "Status",
                type: "select",
                options: [
                  { value: "PENDING_FINANCE", label: "Pending finance" },
                  { value: "COMPLETED", label: "Completed" },
                  { value: "REJECTED", label: "Rejected" },
                  { value: "PENDING_ADMIN", label: "Pending admin" },
                ],
              },
              { name: "from", label: "From", type: "date" },
              { name: "to", label: "To", type: "date" },
            ]}
          />
        </Suspense>
      </AdminCard>

      <AdminCard className="overflow-hidden">
        <AdminTableToolbar>
          <p className="text-sm text-muted">{result.total} refund request{result.total === 1 ? "" : "s"}</p>
        </AdminTableToolbar>
        <AdminTable>
          <AdminTableHeader>
            <tr>
              <AdminTableHead>Refund</AdminTableHead>
              <AdminTableHead>Order</AdminTableHead>
              <AdminTableHead>Customer</AdminTableHead>
              <AdminTableHead>Requested</AdminTableHead>
              <AdminTableHead>Status</AdminTableHead>
              <AdminTableHead>Date</AdminTableHead>
              <AdminTableHead align="right"> </AdminTableHead>
            </tr>
          </AdminTableHeader>
          <AdminTableBody>
            {result.items.length === 0 ? (
              <AdminTableEmpty colSpan={7} title="No refund requests" description="Refund requests appear after admin submits them." />
            ) : (
              result.items.map((refund: {
                id: string;
                refund_number: string;
                requested_amount_minor: number;
                status: string;
                created_at: string;
                orders?: unknown;
                customers?: { profiles?: unknown };
              }) => (
                <AdminTableRow key={refund.id}>
                  <AdminTableCell className="font-medium text-navy">{refund.refund_number}</AdminTableCell>
                  <AdminTableCell>{orderNumberFromJoin(refund.orders as never)}</AdminTableCell>
                  <AdminTableCell className="text-muted">
                    {profileFromJoin(refund.customers?.profiles as never).label}
                  </AdminTableCell>
                  <AdminTableCell className="tabular-nums">{formatMoney(refund.requested_amount_minor)}</AdminTableCell>
                  <AdminTableCell>
                    <FinanceStatusBadge status={refund.status} />
                  </AdminTableCell>
                  <AdminTableCell className="text-muted">
                    {new Date(refund.created_at).toLocaleDateString()}
                  </AdminTableCell>
                  <AdminTableCell align="right">
                    <Link href={`/admin/finance/refunds/${refund.id}`} className="font-medium text-navy hover:underline">
                      Review
                    </Link>
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
