import Link from "next/link";
import { Suspense } from "react";
import { requireAdminPageAccess } from "@/server/admin/page-access";
import { listInvoices } from "@/server/finance/queries";
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
  return qs ? `/admin/finance/invoices?${qs}` : "/admin/finance/invoices";
}

export default async function FinanceInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  await requireAdminPageAccess("invoices.view", "finance.read");
  const params = await searchParams;
  const page = Number(params.page ?? 1);

  const result = await listInvoices({
    page,
    search: params.search,
    status: params.status,
  }).catch(() => ({ items: [], total: 0, page: 1, pageSize: 25, totalPages: 0 }));

  return (
    <div>
      <AdminPageHeader title="Invoices" description="Customer invoices linked to orders" />
      <FinanceSubNav />

      <AdminCard className="mb-4 p-4">
        <Suspense fallback={null}>
          <FinanceFilterBar
            basePath="/admin/finance/invoices"
            fields={[
              { name: "search", label: "Search", placeholder: "Invoice or order #" },
              {
                name: "status",
                label: "Payment status",
                type: "select",
                options: [
                  { value: "PAID", label: "Paid" },
                  { value: "PENDING", label: "Pending" },
                  { value: "REFUNDED", label: "Refunded" },
                ],
              },
            ]}
          />
        </Suspense>
      </AdminCard>

      <AdminCard className="overflow-hidden">
        <AdminTableToolbar>
          <p className="text-sm text-muted">{result.total} invoice{result.total === 1 ? "" : "s"}</p>
        </AdminTableToolbar>
        <AdminTable>
          <AdminTableHeader>
            <tr>
              <AdminTableHead>Invoice</AdminTableHead>
              <AdminTableHead>Order</AdminTableHead>
              <AdminTableHead>Customer</AdminTableHead>
              <AdminTableHead>Total</AdminTableHead>
              <AdminTableHead>Payment</AdminTableHead>
              <AdminTableHead>Issued</AdminTableHead>
              <AdminTableHead align="right"> </AdminTableHead>
            </tr>
          </AdminTableHeader>
          <AdminTableBody>
            {result.items.length === 0 ? (
              <AdminTableEmpty colSpan={7} title="No invoices" description="Invoices are created when orders are placed." />
            ) : (
              result.items.map((invoice: {
                id: string;
                invoice_number: string;
                total_minor: number;
                payment_status: string;
                issued_at: string;
                orders?: unknown;
                customers?: { profiles?: unknown };
              }) => (
                <AdminTableRow key={invoice.id}>
                  <AdminTableCell className="font-medium text-navy">{invoice.invoice_number}</AdminTableCell>
                  <AdminTableCell>{orderNumberFromJoin(invoice.orders as never)}</AdminTableCell>
                  <AdminTableCell className="text-muted">
                    {profileFromJoin(invoice.customers?.profiles as never).label}
                  </AdminTableCell>
                  <AdminTableCell className="tabular-nums">{formatMoney(invoice.total_minor)}</AdminTableCell>
                  <AdminTableCell>
                    <FinanceStatusBadge status={invoice.payment_status} />
                  </AdminTableCell>
                  <AdminTableCell className="text-muted">
                    {new Date(invoice.issued_at).toLocaleDateString()}
                  </AdminTableCell>
                  <AdminTableCell align="right">
                    <Link href={`/admin/finance/invoices/${invoice.id}`} className="font-medium text-navy hover:underline">
                      View
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
