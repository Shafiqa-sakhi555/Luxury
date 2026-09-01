import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { getOrderStatusMeta } from "@/lib/orders/status";
import { CustomerOrderStatusBadge } from "@/components/account/CustomerOrderStatusBadge";
import { Card } from "@/components/ui/card";
import { CopyOrderNumber } from "@/components/commerce/CopyOrderNumber";
import type { PublicOrderTracking } from "@/server/orders/public-tracking";

export function OrderTrackingView({ order }: { order: PublicOrderTracking }) {
  const statusMeta = getOrderStatusMeta(order.status);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-red">Order tracking</p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-navy">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted">
            Placed{" "}
            {new Date(order.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            {order.shippingCity ? ` · ${order.shippingCity}` : ""}
          </p>
        </div>
        <CustomerOrderStatusBadge status={order.status} />
      </div>

      <CopyOrderNumber orderNumber={order.orderNumber} className="mt-4" />

      <Card padding="md" className="mt-6">
        <h2 className="text-sm font-semibold text-navy">Where your order is</h2>
        <p className="mt-2 text-sm text-ink">{statusMeta.meaning}</p>
        <p className="mt-3 text-sm text-muted">{statusMeta.nextSteps}</p>
      </Card>

      <ul className="mt-8 space-y-3">
        {order.items.map((item, index) => (
          <li
            key={`${item.sku}-${index}`}
            className="flex justify-between rounded-xl border border-navy/10 bg-white p-4 text-sm"
          >
            <div>
              <p className="font-medium text-navy">{item.name}</p>
              <p className="text-xs text-muted">
                {[item.color, item.size, item.sku].filter(Boolean).join(" · ")} × {item.quantity}
              </p>
            </div>
            <span className="tabular-nums">{formatMoney(item.lineTotalMinor)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between border-t border-navy/10 pt-4">
        <span className="text-sm text-muted">
          {order.paymentMethod === "COD" ? "Cash on delivery" : order.paymentMethod} ·{" "}
          {formatMoney(order.totalMinor)}
        </span>
      </div>

      {order.history.length > 0 ? (
        <Card padding="md" className="mt-8">
          <h2 className="text-sm font-semibold text-navy">Status updates</h2>
          <ul className="mt-4 space-y-3">
            {order.history.map((entry) => {
              const entryMeta = getOrderStatusMeta(entry.status);
              return (
                <li key={`${entry.status}-${entry.at}`} className="rounded-lg border border-navy/10 px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CustomerOrderStatusBadge status={entry.status} />
                    <span className="text-xs text-muted">{new Date(entry.at).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-muted">{entry.reason || entryMeta.nextSteps}</p>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}

      <p className="mt-8 text-sm text-muted">
        Need help?{" "}
        <Link href="/contact" className="text-navy hover:underline">
          Contact us
        </Link>{" "}
        with this order ID.
      </p>
    </div>
  );
}
