import Link from "next/link";
import { getDashboardSummary } from "@/server/audit";
import { AdminPageHeader, StatCard, AdminCard } from "@/components/admin/layout/AdminPageHeader";
import { formatMoney } from "@/lib/money";

export default async function AdminDashboardPage() {
  let summary;
  try {
    summary = await getDashboardSummary();
  } catch {
    summary = {
      products: { published: 0, draft: 0, total: 0 },
      orders: { pending: 0, total: 0 },
      customers: 0,
      revenueMinor: 0,
      lowStockCount: 0,
      recentOrders: [],
      recentAudit: [],
    };
  }

  return (
    <div>
      <AdminPageHeader
        title="Overview"
        description="Operational snapshot for Jalal's Home Solution"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={formatMoney(summary.revenueMinor)} />
        <StatCard label="Orders" value={String(summary.orders.total)} hint={`${summary.orders.pending} pending`} />
        <StatCard label="Customers" value={String(summary.customers)} />
        <StatCard
          label="Products"
          value={String(summary.products.published)}
          hint={`${summary.products.draft} drafts`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AdminCard className="p-5">
          <h2 className="text-sm font-semibold text-navy">Needs attention</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-muted">Low stock SKUs</span>
              <Link href="/admin/inventory" className="font-medium text-navy hover:underline">
                {summary.lowStockCount}
              </Link>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted">Pending orders</span>
              <Link href="/admin/orders?status=PENDING" className="font-medium text-navy hover:underline">
                {summary.orders.pending}
              </Link>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted">Draft products</span>
              <Link href="/admin/catalog/products?status=DRAFT" className="font-medium text-navy hover:underline">
                {summary.products.draft}
              </Link>
            </li>
          </ul>
        </AdminCard>

        <AdminCard className="p-5">
          <h2 className="text-sm font-semibold text-navy">Recent orders</h2>
          {summary.recentOrders.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No orders yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {summary.recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between text-sm">
                  <div>
                    <Link href={`/admin/orders/${order.id}`} className="font-medium text-navy hover:underline">
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-muted">
                      {order.customer.user.name ?? order.customer.user.email}
                    </p>
                  </div>
                  <span className="tabular-nums">{formatMoney(order.totalMinor)}</span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
