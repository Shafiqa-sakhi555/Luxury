import Link from "next/link";
import { adminListOrders } from "@/server/orders";
import { requireAdminPageAccess } from "@/server/admin/page-access";
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
  OrderStatusBadge,
  AdminFilterPills,
  orderStatusFilterItems,
} from "@/components/admin/ui";
import { formatMoney } from "@/lib/money";

function buildOrdersHref(page: number, status?: string) {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (page > 1) query.set("page", String(page));
  const qs = query.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const status = params.status;

  await requireAdminPageAccess("order.read");
  const result = await adminListOrders({
    page,
    status,
  }).catch(() => ({ items: [], total: 0, page: 1, pageSize: 25, totalPages: 0 }));

  return (
    <div>
      <AdminPageHeader title="Orders" description="Manage fulfilment and order status transitions" />

      <AdminCard className="mb-4 p-4">
        <AdminFilterPills items={orderStatusFilterItems(status)} activeValue={status} />
      </AdminCard>

      <AdminCard className="overflow-hidden">
        <AdminTableToolbar>
          <p className="text-sm text-muted">
            {result.total} order{result.total === 1 ? "" : "s"}
            {status ? ` · ${status.replace(/_/g, " ").toLowerCase()}` : ""}
          </p>
        </AdminTableToolbar>

        <AdminTable>
          <AdminTableHeader>
            <tr>
              <AdminTableHead>Order</AdminTableHead>
              <AdminTableHead>Customer</AdminTableHead>
              <AdminTableHead>Total</AdminTableHead>
              <AdminTableHead>Status</AdminTableHead>
              <AdminTableHead align="right"> </AdminTableHead>
            </tr>
          </AdminTableHeader>
          <AdminTableBody>
            {result.items.length === 0 ? (
              <AdminTableEmpty
                colSpan={5}
                title="No orders found"
                description={
                  status
                    ? `No orders with status "${status.replace(/_/g, " ").toLowerCase()}".`
                    : "Orders will appear here when customers complete checkout."
                }
                action={status ? { label: "View all orders", href: "/admin/orders" } : undefined}
              />
            ) : (
              result.items.map((order: {
                id: string;
                order_number: string;
                total_minor: number;
                status: string;
                customers?: { profiles?: { name?: string | null; email?: string | null } | null } | null;
              }) => (
                <AdminTableRow key={order.id}>
                  <AdminTableCell className="font-medium text-navy">{order.order_number}</AdminTableCell>
                  <AdminTableCell className="text-muted">
                    {order.customers?.profiles?.name ?? order.customers?.profiles?.email ?? "—"}
                  </AdminTableCell>
                  <AdminTableCell className="tabular-nums">{formatMoney(order.total_minor)}</AdminTableCell>
                  <AdminTableCell>
                    <OrderStatusBadge status={order.status} />
                  </AdminTableCell>
                  <AdminTableCell align="right">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium text-navy hover:underline">
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
          buildHref={(p) => buildOrdersHref(p, status)}
        />
      </AdminCard>
    </div>
  );
}
