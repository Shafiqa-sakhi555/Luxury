import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

  // 2. Calculate Totals
  let subtotalMinor = 0;
  for (const item of cart.cart_items) {
    const price = item.price_snapshot_minor ?? item.product_variants.price_minor;
    subtotalMinor += price * item.quantity;
  }
  const deliveryMinor = subtotalMinor >= 5_000_000 ? 0 : 250_000;
  const totalMinor = subtotalMinor + deliveryMinor;

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
  const orderItems = cart.cart_items.map((item: any) => ({
    order_id: order.id,
    variant_id: item.variant_id,
    product_name: item.product_variants.products.name,
    variant_sku: item.product_variants.sku,
    unit_price_minor: item.price_snapshot_minor ?? item.product_variants.price_minor,
    quantity: item.quantity,
    line_total_minor: (item.price_snapshot_minor ?? item.product_variants.price_minor) * item.quantity
  }));

  await supabase.from("order_items").insert(orderItems);
  await supabase.from("order_status_history").insert({ order_id: order.id, to_status: "PENDING", reason: "Order placed" });
  await supabase.from("cart_items").delete().eq("cart_id", cart.id);

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

export async function updateOrderStatus(orderId: string, status: string, reason?: string) {
  const supabase = createSupabaseAdminClient();
  const { data: order } = await supabase.from("orders").select("status").eq("id", orderId).maybeSingle();
  
  if (!order) throw new Error("Order not found");

  await supabase.from("orders").update({ status }).eq("id", orderId);
  await supabase.from("order_status_history").insert({
    order_id: orderId,
    from_status: order.status,
    to_status: status,
    reason,
  });
}
