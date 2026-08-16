import Link from "next/link";
import { getDashboardSummary } from "@/server/audit";
import { requireAdminPageAccess } from "@/server/admin/page-access";
import { hasAnyPermission } from "@/server/rbac";
import { AdminPageHeader, StatCard, AdminCard } from "@/components/admin/layout/AdminPageHeader";
import { formatMoney } from "@/lib/money";

function customerLabel(order: {
  order_number: string;
  total_minor: number;
  customers?: { profiles?: { name?: string | null; email?: string | null } | null } | null;
  shipping_name?: string | null;
}) {
  const profile = order.customers?.profiles;
  return profile?.name ?? profile?.email ?? order.shipping_name ?? "Guest";
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ access?: string }>;
}) {
  const ctx = await requireAdminPageAccess(
    "order.read",
    "finance.read",
    "product.write",
    "inventory.read",
    "customer.read"
  );
  const params = await searchParams;

  const canSeeRevenue = hasAnyPermission(ctx.permissions, ["finance.read"]);
  const canSeeOrders = hasAnyPermission(ctx.permissions, ["order.read"]);
  const canSeeCustomers = hasAnyPermission(ctx.permissions, ["customer.read"]);
  const canSeeProducts = hasAnyPermission(ctx.permissions, ["product.write"]);
  const canSeeInventory = hasAnyPermission(ctx.permissions, ["inventory.read"]);

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
    };
  }

  return (
    <div>
      <AdminPageHeader
        title="Overview"
        description="Operational snapshot for Jalal's Home Solution"
      />

      {params.access === "denied" ? (
        <AdminCard className="mb-6 border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          You don&apos;t have permission to view that page. Use the sidebar links available for your role.
        </AdminCard>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {canSeeRevenue ? (
          <StatCard label="Revenue" value={formatMoney(summary.revenueMinor)} />
        ) : null}
        {canSeeOrders ? (
          <StatCard
            label="Orders"
            value={String(summary.orders.total)}
            hint={`${summary.orders.pending} pending`}
          />
        ) : null}
        {canSeeCustomers ? (
          <StatCard label="Customers" value={String(summary.customers)} />
        ) : null}
        {canSeeProducts ? (
          <StatCard
            label="Products"
            value={String(summary.products.published)}
            hint={`${summary.products.draft} drafts`}
          />
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AdminCard className="p-5">
          <h2 className="text-sm font-semibold text-navy">Needs attention</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {canSeeInventory ? (
              <li className="flex items-center justify-between">
                <span className="text-muted">Low stock SKUs</span>
                <Link href="/admin/inventory" className="font-medium text-navy hover:underline">
                  {summary.lowStockCount}
                </Link>
              </li>
            ) : null}
            {canSeeOrders ? (
              <li className="flex items-center justify-between">
                <span className="text-muted">Pending orders</span>
                <Link href="/admin/orders?status=PENDING" className="font-medium text-navy hover:underline">
                  {summary.orders.pending}
                </Link>
              </li>
            ) : null}
            {canSeeProducts ? (
              <li className="flex items-center justify-between">
                <span className="text-muted">Draft products</span>
                <Link
                  href="/admin/catalog/products?status=DRAFT"
                  className="font-medium text-navy hover:underline"
                >
                  {summary.products.draft}
                </Link>
              </li>
            ) : null}
            {!canSeeInventory && !canSeeOrders && !canSeeProducts ? (
              <li className="text-muted">No actionable items for your role.</li>
            ) : null}
          </ul>
        </AdminCard>

        <AdminCard className="p-5">
          <h2 className="text-sm font-semibold text-navy">Recent orders</h2>
          {!canSeeOrders ? (
            <p className="mt-4 text-sm text-muted">Order summaries are not available for your role.</p>
          ) : summary.recentOrders.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No orders yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {summary.recentOrders.map((order: {
                id: string;
                order_number: string;
                total_minor: number;
                customers?: { profiles?: { name?: string | null; email?: string | null } | null } | null;
                shipping_name?: string | null;
              }) => (
                <li key={order.id} className="flex items-center justify-between text-sm">
                  <div>
                    <Link href={`/admin/orders/${order.id}`} className="font-medium text-navy hover:underline">
                      {order.order_number}
                    </Link>
                    <p className="text-xs text-muted">{customerLabel(order)}</p>
                  </div>
                  <span className="tabular-nums">{formatMoney(order.total_minor)}</span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
