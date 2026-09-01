import Link from "next/link";
import { notFound } from "next/navigation";
import { adminGetOrderById } from "@/server/orders";
import { requireAdminPageAccess } from "@/server/admin/page-access";
import { canWriteOrders } from "@/server/rbac";
import { getRemainingRefundableMinor } from "@/server/finance/queries";
import { canCreateRefunds } from "@/lib/auth/finance-permissions";
import { AdminPageHeader, AdminCard } from "@/components/admin/layout/AdminPageHeader";
import {
  AdminTable,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableHead,
  AdminTableCell,
  OrderStatusBadge,
} from "@/components/admin/ui";
import { formatStatusLabel } from "@/lib/admin/status-badges";
import { OrderStatusForm } from "@/components/admin/orders/OrderStatusForm";
import { CreateRefundRequestForm } from "@/components/admin/finance/CreateRefundRequestForm";
import { formatMoney } from "@/lib/money";
import { variantDisplayFromOrderItem } from "@/lib/orders/line-item";

function profileFromOrder(order: {
  customers?: {
    phone?: string | null;
    profiles?: { name?: string | null; email?: string | null } | null;
  } | null;
  shipping_name?: string | null;
  shipping_phone?: string | null;
}) {
  const profile = Array.isArray(order.customers?.profiles)
    ? order.customers?.profiles[0]
    : order.customers?.profiles;
  return {
    name: profile?.name ?? order.shipping_name ?? "Guest",
    email: profile?.email ?? "—",
    phone: order.customers?.phone ?? order.shipping_phone ?? "—",
  };
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAdminPageAccess("order.read");
  const { id } = await params;
  const order = await adminGetOrderById(id);

  if (!order) notFound();

  const customer = profileFromOrder(order);
  const remainingRefundable = await getRemainingRefundableMinor(order.id).catch(() => 0);
  const canRequestRefund = canCreateRefunds(ctx.permissions);
  const history = [...(order.order_status_history ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div>
      <AdminPageHeader
        title={order.order_number}
        description={`Placed ${new Date(order.created_at).toLocaleString()}`}
        actions={
          <Link href="/admin/orders" className="text-sm text-navy hover:underline">
            Back to orders
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <AdminCard className="overflow-hidden">
            <div className="border-b border-navy/10 px-5 py-4">
              <h2 className="text-sm font-semibold text-navy">Line items</h2>
            </div>
            <AdminTable>
              <AdminTableHeader>
                <tr>
                  <AdminTableHead>Product</AdminTableHead>
                  <AdminTableHead>Color</AdminTableHead>
                  <AdminTableHead>Size</AdminTableHead>
                  <AdminTableHead>SKU</AdminTableHead>
                  <AdminTableHead>Qty</AdminTableHead>
                  <AdminTableHead align="right">Total</AdminTableHead>
                </tr>
              </AdminTableHeader>
              <AdminTableBody>
                {(order.order_items ?? []).map((item: {
                  id: string;
                  product_name: string;
                  variant_sku: string;
                  variant_name?: string | null;
                  quantity: number;
                  line_total_minor: number;
                  customization?: { color?: string | null; size?: string | null } | null;
                  product_variants?: { color?: string | null; size?: string | null; name?: string | null } | null;
                }) => {
                  const variant = variantDisplayFromOrderItem(item);
                  return (
                  <AdminTableRow key={item.id}>
                    <AdminTableCell>{item.product_name}</AdminTableCell>
                    <AdminTableCell className="text-muted">{variant.color ?? "—"}</AdminTableCell>
                    <AdminTableCell className="text-muted">{variant.size ?? "—"}</AdminTableCell>
                    <AdminTableCell className="text-muted">{item.variant_sku}</AdminTableCell>
                    <AdminTableCell className="tabular-nums">{item.quantity}</AdminTableCell>
                    <AdminTableCell align="right" className="tabular-nums">
                      {formatMoney(item.line_total_minor)}
                    </AdminTableCell>
                  </AdminTableRow>
                  );
                })}
              </AdminTableBody>
            </AdminTable>
          </AdminCard>

          <AdminCard className="p-5">
            <h2 className="text-sm font-semibold text-navy">Status history</h2>
            {history.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No status changes recorded.</p>
            ) : (
              <ul className="mt-4 space-y-3 text-sm">
                {history.map((entry: {
                  id: string;
                  from_status: string | null;
                  to_status: string;
                  reason: string | null;
                  created_at: string;
                }) => (
                  <li key={entry.id} className="rounded-lg border border-navy/10 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-navy">
                        {entry.from_status
                          ? `${formatStatusLabel(entry.from_status)} → ${formatStatusLabel(entry.to_status)}`
                          : formatStatusLabel(entry.to_status)}
                      </span>
                      <span className="text-xs text-muted">
                        {new Date(entry.created_at).toLocaleString()}
                      </span>
                    </div>
                    {entry.reason ? <p className="mt-1 text-muted">{entry.reason}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-navy">Order status</h2>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="mt-4">
              <OrderStatusForm
                orderId={order.id}
                currentStatus={order.status}
                canEdit={canWriteOrders(ctx.permissions)}
              />
            </div>
          </AdminCard>

          <AdminCard className="space-y-3 p-5 text-sm">
            <h2 className="font-semibold text-navy">Customer</h2>
            <p>{customer.name}</p>
            <p className="text-muted">{customer.email}</p>
            <p className="text-muted">{customer.phone}</p>
          </AdminCard>

          <AdminCard className="space-y-2 p-5 text-sm">
            <h2 className="font-semibold text-navy">Totals</h2>
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span className="tabular-nums">{formatMoney(order.subtotal_minor)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Delivery</span>
              <span className="tabular-nums">{formatMoney(order.delivery_minor)}</span>
            </div>
            <div className="flex justify-between border-t border-navy/10 pt-2 font-medium text-navy">
              <span>Total</span>
              <span className="tabular-nums">{formatMoney(order.total_minor)}</span>
            </div>
          </AdminCard>

          <AdminCard className="space-y-2 p-5 text-sm">
            <h2 className="font-semibold text-navy">Shipping</h2>
            <p>{order.shipping_name ?? "—"}</p>
            <p className="text-muted">{order.shipping_line1}</p>
            {order.shipping_line2 ? <p className="text-muted">{order.shipping_line2}</p> : null}
            <p className="text-muted">
              {[order.shipping_city, order.shipping_region, order.shipping_postal].filter(Boolean).join(", ")}
            </p>
            <p className="text-muted">{order.shipping_phone}</p>
          </AdminCard>

          {canRequestRefund && ["DELIVERED", "SHIPPED", "CANCELLED"].includes(order.status) ? (
            <CreateRefundRequestForm
              orderId={order.id}
              orderNumber={order.order_number}
              remainingRefundableMinor={remainingRefundable}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
