import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function txnNumberFromOrderId(orderId: string) {
  return `TXN-${orderId.replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

function mapOrderPaymentStatus(order: {
  status: string;
  payment_method?: string | null;
  payment_status?: string | null;
}) {
  if (order.status === "CANCELLED") return "CANCELLED";
  if (order.payment_status === "REFUNDED") return "REFUNDED";
  if (order.payment_status === "PARTIALLY_REFUNDED") return "PARTIALLY_REFUNDED";
  if (order.payment_status === "PAID") return "SUCCESSFUL";
  if (order.status === "DELIVERED" && (order.payment_method ?? "COD") === "COD") {
    return "SUCCESSFUL";
  }
  if (order.payment_status === "FAILED") return "FAILED";
  return "PENDING";
}

export async function ensureFinancialRecordsForOrder(orderId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_id, status, payment_method, payment_status, subtotal_minor, discount_minor, delivery_minor, tax_minor, total_minor, created_at"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) {
    throw new Error(error?.message ?? "Order not found");
  }

  const paymentStatus = mapOrderPaymentStatus(order);
  const provider = (order.payment_method ?? "COD") === "COD" ? "cod" : "manual";

  const { data: existingTxn } = await supabase
    .from("financial_transactions")
    .select("id, refund_amount_minor")
    .eq("order_id", orderId)
    .maybeSingle();

  const refundMinor = existingTxn?.refund_amount_minor ?? 0;
  const netMinor = Math.max(0, order.total_minor - refundMinor);

  if (existingTxn) {
    await supabase
      .from("financial_transactions")
      .update({
        amount_minor: order.total_minor,
        tax_minor: order.tax_minor ?? 0,
        payment_method: order.payment_method ?? "COD",
        payment_provider: provider,
        payment_status: paymentStatus,
        net_amount_minor: netMinor,
        refund_amount_minor: refundMinor,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingTxn.id);
  } else {
    await supabase.from("financial_transactions").insert({
      order_id: order.id,
      transaction_number: txnNumberFromOrderId(order.id),
      customer_id: order.customer_id,
      amount_minor: order.total_minor,
      payment_method: order.payment_method ?? "COD",
      payment_provider: provider,
      payment_status: paymentStatus,
      tax_minor: order.tax_minor ?? 0,
      refund_amount_minor: 0,
      net_amount_minor: order.total_minor,
      transaction_date: order.created_at,
    });
  }

  const invoicePaymentStatus =
    paymentStatus === "SUCCESSFUL"
      ? "PAID"
      : paymentStatus === "REFUNDED" || paymentStatus === "PARTIALLY_REFUNDED"
        ? paymentStatus
        : order.status === "CANCELLED"
          ? "VOID"
          : "UNPAID";

  const { data: existingInvoice } = await supabase
    .from("invoices")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  const invoicePayload = {
    customer_id: order.customer_id,
    subtotal_minor: order.subtotal_minor,
    discount_minor: order.discount_minor ?? 0,
    delivery_minor: order.delivery_minor ?? 0,
    tax_minor: order.tax_minor ?? 0,
    total_minor: order.total_minor,
    payment_status: invoicePaymentStatus,
    status: order.status === "CANCELLED" ? "VOID" : "ISSUED",
    updated_at: new Date().toISOString(),
  };

  if (existingInvoice) {
    await supabase.from("invoices").update(invoicePayload).eq("id", existingInvoice.id);
  } else {
    await supabase.from("invoices").insert({
      order_id: order.id,
      invoice_number: `INV-${order.order_number}`,
      ...invoicePayload,
      issued_at: order.created_at,
    });
  }

  if (paymentStatus === "SUCCESSFUL") {
    await supabase.from("orders").update({ payment_status: "PAID" }).eq("id", orderId);
  }
}

export async function syncFinancialRecordsOnOrderStatusChange(
  orderId: string,
  newStatus: string,
  previousStatus: string
) {
  if (newStatus === previousStatus) return;

  const supabase = createSupabaseAdminClient();
  if (newStatus === "DELIVERED") {
    await supabase.from("orders").update({ payment_status: "PAID" }).eq("id", orderId);
  }
  if (newStatus === "CANCELLED") {
    await supabase.from("orders").update({ payment_status: "CANCELLED" }).eq("id", orderId);
  }

  await ensureFinancialRecordsForOrder(orderId);
}
