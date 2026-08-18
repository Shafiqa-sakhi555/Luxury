import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatMoney } from "@/lib/money";
import { loadOrderStatusDefinitions } from "./knowledge/loader";

export async function getCustomerOrderByNumber(customerId: string, orderNumber: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*), order_status_history(*)")
    .eq("customer_id", customerId)
    .ilike("order_number", orderNumber)
    .maybeSingle();

  return data;
}

export async function listCustomerOrdersDetailed(customerId: string, limit = 5) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("orders")
    .select("id, order_number, status, total_minor, created_at, payment_method")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function formatOrderForAssistant(order: {
  order_number: string;
  status: string;
  total_minor: number;
  payment_method?: string;
  created_at: string;
  shipping_city?: string | null;
  order_items?: Array<{
    product_name: string;
    variant_sku: string;
    quantity: number;
    unit_price_minor: number;
    line_total_minor: number;
  }>;
  order_status_history?: Array<{
    to_status: string;
    reason?: string | null;
    created_at: string;
  }>;
}) {
  const statusDefs = (await loadOrderStatusDefinitions()) as {
    statuses: Array<{ code: string; customer_label: string; meaning: string; next_steps: string }>;
  };

  const statusInfo = statusDefs.statuses.find((s) => s.code === order.status);

  return {
    orderNumber: order.order_number,
    status: order.status,
    statusLabel: statusInfo?.customer_label ?? order.status,
    statusMeaning: statusInfo?.meaning ?? null,
    nextSteps: statusInfo?.next_steps ?? null,
    total: formatMoney(order.total_minor),
    paymentMethod: order.payment_method ?? "COD",
    placedAt: order.created_at,
    shippingCity: order.shipping_city ?? null,
    items: (order.order_items ?? []).map((item) => ({
      name: item.product_name,
      sku: item.variant_sku,
      quantity: item.quantity,
      unitPrice: formatMoney(item.unit_price_minor),
      lineTotal: formatMoney(item.line_total_minor),
    })),
    history: [...(order.order_status_history ?? [])]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((h) => ({
        status: h.to_status,
        reason: h.reason,
        at: h.created_at,
      })),
    accountUrl: `/account/orders`,
  };
}
