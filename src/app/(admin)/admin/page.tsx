import Link from "next/link";
import {
  Banknote,
  ShoppingCart,
  Users,
  MessageCircle,
  Package,
  AlertTriangle,
  FileEdit,
} from "lucide-react";
import { getDashboardSummary } from "@/server/audit";
import { requireAdminPageAccess } from "@/server/admin/page-access";
import { hasAnyPermission } from "@/server/rbac";
import { AdminPageHeader, StatCard, AdminCard } from "@/components/admin/layout/AdminPageHeader";
import { OrderStatusBadge, HandoffStatusBadge } from "@/components/admin/ui";
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
      pendingHandoffs: 0,
      recentOrders: [],
      recentHandoffs: [],
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
          <StatCard
            label="Revenue"
            value={formatMoney(summary.revenueMinor)}
            hint="Delivered orders only"
            icon={<Banknote className="h-5 w-5" />}
            tone="emerald"
          />
        ) : null}
        {canSeeOrders ? (
          <StatCard
            label="Orders"
            value={String(summary.orders.total)}
            hint={`${summary.orders.pending} pending`}
            icon={<ShoppingCart className="h-5 w-5" />}
            tone="navy"
          />
        ) : null}
        {canSeeCustomers ? (
          <StatCard
            label="Customers"
            value={String(summary.customers)}
            icon={<Users className="h-5 w-5" />}
            tone="blue"
          />
        ) : null}
        {canSeeCustomers ? (
          <StatCard
            label="Assistant handoffs"
            value={String(summary.pendingHandoffs)}
            hint="pending follow-up"
            icon={<MessageCircle className="h-5 w-5" />}
            tone="red"
          />
        ) : null}
        {canSeeProducts ? (
          <StatCard
            label="Products"
            value={String(summary.products.published)}
            hint={`${summary.products.draft} drafts`}
            icon={<Package className="h-5 w-5" />}
            tone="navy"
          />
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AdminCard className="p-5 sm:p-6">
          <h2 className="font-display text-xl text-navy">Needs attention</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {canSeeInventory ? (
              <li>
                <Link
                  href="/admin/inventory"
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 transition hover:bg-navy/[0.04]"
                >
                  <span className="flex items-center gap-2 text-muted">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Low stock SKUs
                  </span>
                  <span className="font-semibold tabular-nums text-navy">{summary.lowStockCount}</span>
                </Link>
              </li>
            ) : null}
            {canSeeOrders ? (
              <li>
                <Link
                  href="/admin/orders?status=PENDING"
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 transition hover:bg-navy/[0.04]"
                >
                  <span className="flex items-center gap-2 text-muted">
                    <ShoppingCart className="h-4 w-4 text-navy/50" />
                    Pending orders
                  </span>
                  <span className="font-semibold tabular-nums text-navy">{summary.orders.pending}</span>
                </Link>
              </li>
            ) : null}
            {canSeeProducts ? (
              <li>
                <Link
                  href="/admin/catalog/products?status=DRAFT"
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 transition hover:bg-navy/[0.04]"
                >
                  <span className="flex items-center gap-2 text-muted">
                    <FileEdit className="h-4 w-4 text-navy/50" />
                    Draft products
                  </span>
                  <span className="font-semibold tabular-nums text-navy">{summary.products.draft}</span>
                </Link>
              </li>
            ) : null}
            {canSeeCustomers ? (
              <li>
                <Link
                  href="/admin/assistant?status=PENDING"
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 transition hover:bg-navy/[0.04]"
                >
                  <span className="flex items-center gap-2 text-muted">
                    <MessageCircle className="h-4 w-4 text-navy/50" />
                    Pending assistant handoffs
                  </span>
                  <span className="font-semibold tabular-nums text-navy">{summary.pendingHandoffs}</span>
                </Link>
              </li>
            ) : null}
            {!canSeeInventory && !canSeeOrders && !canSeeProducts && !canSeeCustomers ? (
              <li className="px-3 py-2 text-muted">No actionable items for your role.</li>
            ) : null}
          </ul>
        </AdminCard>

        <AdminCard className="p-5 sm:p-6">
          <h2 className="font-display text-xl text-navy">Recent orders</h2>
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
                status: string;
                customers?: { profiles?: { name?: string | null; email?: string | null } | null } | null;
                shipping_name?: string | null;
              }) => (
                <li key={order.id} className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 text-sm hover:bg-navy/[0.03]">
                  <div className="min-w-0">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium text-navy hover:underline">
                      {order.order_number}
                    </Link>
                    <p className="truncate text-xs text-muted">{customerLabel(order)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="tabular-nums">{formatMoney(order.total_minor)}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        {canSeeCustomers ? (
          <AdminCard className="p-5 sm:p-6 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl text-navy">Recent assistant handoffs</h2>
              <Link href="/admin/assistant" className="text-xs font-medium text-navy hover:underline">
                View all
              </Link>
            </div>
            {summary.recentHandoffs.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No handoff requests yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {summary.recentHandoffs.map((handoff: {
                  id: string;
                  issue_summary: string;
                  status: string;
                  contact_name: string | null;
                  contact_email: string | null;
                  created_at: string;
                }) => (
                  <li key={handoff.id} className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 text-sm hover:bg-navy/[0.03]">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/assistant/${handoff.id}`}
                        className="line-clamp-1 font-medium text-navy hover:underline"
                      >
                        {handoff.issue_summary}
                      </Link>
                      <p className="truncate text-xs text-muted">
                        {handoff.contact_name ?? handoff.contact_email ?? "Anonymous visitor"} ·{" "}
                        {new Date(handoff.created_at).toLocaleString()}
                      </p>
                    </div>
                    <HandoffStatusBadge status={handoff.status} />
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        ) : null}
      </div>
    </div>
  );
}
