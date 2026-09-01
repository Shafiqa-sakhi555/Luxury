import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parseOrderNumber } from "@/lib/orders/number";
import { variantDisplayFromOrderItem } from "@/lib/orders/line-item";

export type PublicOrderTracking = {
  orderNumber: string;
  status: string;
  createdAt: string;
  totalMinor: number;
  paymentMethod: string;
  fulfilmentType: string;
  shippingCity: string | null;
  shippingName: string | null;
  items: Array<{
    name: string;
    sku: string;
    color: string | null;
    size: string | null;
    quantity: number;
    lineTotalMinor: number;
  }>;
  history: Array<{
    status: string;
    at: string;
    reason: string | null;
  }>;
};

export async function getPublicOrderTracking(
  rawOrderNumber: string
): Promise<PublicOrderTracking | null> {
  noStore();
  const orderNumber = parseOrderNumber(rawOrderNumber) ?? rawOrderNumber.trim().toUpperCase();
  if (!orderNumber) return null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "order_number, status, created_at, total_minor, payment_method, fulfilment_type, shipping_city, shipping_name, order_items(product_name, variant_sku, variant_name, customization, quantity, line_total_minor, product_variants(color, size, name)), order_status_history(to_status, reason, created_at)"
    )
    .ilike("order_number", orderNumber)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("getPublicOrderTracking:", error.message);
    return null;
  }

  const items = (data.order_items ?? []) as Array<{
    product_name: string;
    variant_sku: string;
    variant_name?: string | null;
    customization?: { color?: string | null; size?: string | null } | null;
    quantity: number;
    line_total_minor: number;
    product_variants?: { color?: string | null; size?: string | null; name?: string | null } | null;
  }>;

  const history = [...((data.order_status_history ?? []) as Array<{
    to_status: string;
    reason: string | null;
    created_at: string;
  }>)].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return {
    orderNumber: data.order_number,
    status: data.status,
    createdAt: data.created_at,
    totalMinor: data.total_minor,
    paymentMethod: data.payment_method ?? "COD",
    fulfilmentType: data.fulfilment_type ?? "DELIVERY",
    shippingCity: data.shipping_city ?? null,
    shippingName: data.shipping_name ?? null,
    items: items.map((item) => {
      const variant = variantDisplayFromOrderItem(item);
      return {
        name: item.product_name,
        sku: item.variant_sku,
        color: variant.color,
        size: variant.size,
        quantity: item.quantity,
        lineTotalMinor: item.line_total_minor,
      };
    }),
    history: history.map((entry) => ({
      status: entry.to_status,
      at: entry.created_at,
      reason: entry.reason,
    })),
  };
}
