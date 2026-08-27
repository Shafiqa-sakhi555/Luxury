import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveCartItemPriceMinor } from "@/lib/money";
import { getCartTotals } from "@/server/cart";
import {
  ensureFinancialRecordsForOrder,
  syncFinancialRecordsOnOrderStatusChange,
} from "@/server/finance/sync";
import {
  sendNewOrderStaffNotifications,
  sendOrderStatusChangeNotifications,
} from "@/server/orders/notifications";
import { canCustomerCancelOrder } from "@/lib/orders/status";
export type PlaceOrderInput = {
  customerId: string;
  cartId: string;
  fulfilmentType: string;
  storeId?: string;
  paymentMethod?: string;
  shipping: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    region?: string;
    postal?: string;
    phone: string;
  };
  notes?: string;
};

export async function placeOrder(input: PlaceOrderInput) {
  const supabase = createSupabaseAdminClient();
  
  // 1. Fetch Cart
  const { data: cart } = await supabase.from("carts").select("*, cart_items(*, product_variants(*, products(*, product_images(*))))").eq("id", input.cartId).single();
  if (!cart || cart.cart_items.length === 0) throw new Error("Cart is empty");

  const totals = await getCartTotals(cart);
  const { subtotalMinor, deliveryMinor, totalMinor } = totals;

  // 3. Create Order
  const orderNumber = `JHS-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  
  const { data: order, error: orderError } = await supabase.from("orders").insert({
    order_number: orderNumber,
    customer_id: input.customerId,
    status: "PENDING",
    payment_method: input.paymentMethod ?? "COD",
    fulfilment_type: input.fulfilmentType,
    subtotal_minor: subtotalMinor,
    delivery_minor: deliveryMinor,
    total_minor: totalMinor,
    shipping_name: input.shipping.name,
    shipping_line1: input.shipping.line1,
    shipping_city: input.shipping.city,
    shipping_phone: input.shipping.phone,
    notes: input.notes,
  }).select().single();

  if (orderError) throw new Error(orderError.message);

  // 4. Create Order Items
  const orderItems = cart.cart_items.map((item: any) => {
    const variant = item.product_variants;
    const product = Array.isArray(variant?.products) ? variant.products[0] : variant?.products;
    const unitPrice = resolveCartItemPriceMinor({
      priceSnapshotMinor: item.price_snapshot_minor,
      variantPriceMinor: variant?.price_minor,
      variantSalePriceMinor: variant?.sale_price_minor,
      productOriginalPriceMinor: product?.original_price_minor,
      productSalePriceMinor: product?.sale_price_minor,
    });

    return {
      order_id: order.id,
      variant_id: item.variant_id,
      product_name: item.product_variants.products.name,
      variant_sku: item.product_variants.sku,
      unit_price_minor: unitPrice,
      quantity: item.quantity,
      line_total_minor: unitPrice * item.quantity,
    };
  });

  await supabase.from("order_items").insert(orderItems);
  await supabase.from("order_status_history").insert({ order_id: order.id, to_status: "PENDING", reason: "Order placed" });
  await supabase.from("cart_items").delete().eq("cart_id", cart.id);

  await ensureFinancialRecordsForOrder(order.id);

  void sendNewOrderStaffNotifications(order.id).catch((error) => {
    console.error("New order staff notification failed:", error);
  });

  return order;
}

export async function adminListOrders(params?: { page?: number; pageSize?: number; search?: string; status?: string }) {
  const supabase = createSupabaseAdminClient();
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 25;
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  let query = supabase.from("orders").select("*, customers(profiles(name, email))", { count: "exact" });

  if (params?.status) {
    query = query.eq("status", params.status);
  }
  if (params?.search) {
    query = query.ilike("order_number", `%${params.search}%`);
  }

  const { data, count } = await query.order("created_at", { ascending: false }).range(start, end);

  return {
    items: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getOrderByNumber(orderNumber: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*), order_status_history(*), customers(profiles(name, email))")
    .eq("order_number", orderNumber)
    .maybeSingle();

  return data;
}

export async function listCustomerOrders(customerId: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function cancelCustomerOrder(input: {
  orderId: string;
  customerId: string;
  customerUserId?: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, customer_id")
    .eq("id", input.orderId)
    .maybeSingle();

  if (!order || order.customer_id !== input.customerId) {
    throw new Error("Order not found.");
  }

  if (!canCustomerCancelOrder(order.status)) {
    throw new Error(
      "This order can no longer be cancelled online. Contact us if you need help."
    );
  }

  await updateOrderStatus(
    order.id,
    "CANCELLED",
    "Cancelled by customer",
    input.customerUserId
  );
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  reason?: string,
  actorId?: string
) {
  const supabase = createSupabaseAdminClient();
  const { data: order } = await supabase.from("orders").select("status").eq("id", orderId).maybeSingle();
  
  if (!order) throw new Error("Order not found");

  await supabase.from("orders").update({ status }).eq("id", orderId);
  await supabase.from("order_status_history").insert({
    order_id: orderId,
    from_status: order.status,
    to_status: status,
    reason,
    actor_id: actorId ?? null,
  });

  await syncFinancialRecordsOnOrderStatusChange(orderId, status, order.status);

  void sendOrderStatusChangeNotifications(orderId, order.status, status, reason).catch((error) => {
    console.error("Order status notification failed:", error);
  });
}

export async function adminGetOrderById(orderId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), order_status_history(*), customers(phone, profiles(name, email))")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    console.error("adminGetOrderById failed:", error.message);
    return null;
  }

  return data;
}
