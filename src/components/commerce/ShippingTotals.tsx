"use client";

import { formatMoney } from "@/lib/money";
import type { ShippingQuote } from "@/lib/shipping/types";

export function ShippingTotals({
  subtotalMinor,
  totalMinor,
  shipping,
  compact = false,
}: {
  subtotalMinor: number;
  totalMinor: number;
  shipping: ShippingQuote;
  compact?: boolean;
}) {
  const rowClass = compact
    ? "flex justify-between text-sm"
    : "flex justify-between text-sm";

  return (
    <dl className="space-y-2">
      <div className={rowClass}>
        <dt className="text-muted">Subtotal</dt>
        <dd className="tabular-nums">{formatMoney(subtotalMinor)}</dd>
      </div>
      {shipping.groups.map((group) => (
        <div key={group.type} className={rowClass}>
          <dt className="text-muted">{group.label}</dt>
          <dd className="tabular-nums">
            {shipping.freeDeliveryApplied ? (
              <span className="text-muted line-through">{formatMoney(group.chargeMinor)}</span>
            ) : (
              formatMoney(group.chargeMinor)
            )}
          </dd>
        </div>
      ))}
      {shipping.freeDeliveryApplied && shipping.freeDeliveryDiscountMinor > 0 ? (
        <div className={rowClass}>
          <dt className="text-muted">Free delivery discount</dt>
          <dd className="tabular-nums text-emerald-700">
            −{formatMoney(shipping.freeDeliveryDiscountMinor)}
          </dd>
        </div>
      ) : null}
      <div className={rowClass}>
        <dt className="text-muted">Total shipping</dt>
        <dd className="tabular-nums">
          {shipping.shippingMinor === 0 ? "Free" : formatMoney(shipping.shippingMinor)}
        </dd>
      </div>
      <div className={`${rowClass} border-t border-navy/10 pt-2 font-medium text-navy`}>
        <dt>Grand total</dt>
        <dd className="tabular-nums">{formatMoney(totalMinor)}</dd>
      </div>
    </dl>
  );
}
