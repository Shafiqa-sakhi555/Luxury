import Link from "next/link";
import { adminListOrders } from "@/server/orders";
import { requireAdminPageAccess } from "@/server/admin/page-access";
import { AdminPageHeader, AdminCard } from "@/components/admin/layout/AdminPageHeader";
import { AdminBadge } from "@/components/admin/ui";
import { formatMoney } from "@/lib/money";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const params = await searchParams;
  await requireAdminPageAccess("order.read");
  const result = await adminListOrders({
    page: Number(params.page ?? 1),
    status: params.status,
  }).catch(() => ({ items: [], total: 0, page: 1, pageSize: 25, totalPages: 0 }));

  return (
    <div>
      <AdminPageHeader title="Orders" description="Manage fulfilment and order status transitions" />
      <AdminCard className="overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="border-b border-navy/10 bg-[#FAFBFD] text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {result.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted">
                  No orders yet.
                </td>
              </tr>
            ) : (
              result.items.map((order: any) => (
                <tr key={order.id} className="border-b border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy">{order.order_number}</td>
                  <td className="px-4 py-3 text-muted">
                    {order.customers?.profiles?.name ?? order.customers?.profiles?.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{formatMoney(order.total_minor)}</td>
                  <td className="px-4 py-3">
                    <AdminBadge tone={order.status === "PENDING" ? "warning" : "default"}>
                      {order.status}
                    </AdminBadge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/orders/${order.id}`} className="text-navy hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminCard>
    </div>
  );
}
