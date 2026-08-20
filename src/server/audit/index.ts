import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { adminGetCatalogProductCounts } from "@/server/catalog/admin-queries";

export async function writeAuditLog(input: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
  ipAddress?: string;
}) {
  const supabase = createSupabaseAdminClient();
  return supabase.from("audit_logs").insert({
    actor_id: input.actorId ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    before: input.before ? (input.before as any) : null,
    after: input.after ? (input.after as any) : null,
    reason: input.reason,
    ip_address: input.ipAddress,
  });
}

export async function getDashboardSummary() {
  const supabase = createSupabaseAdminClient();
  
  // order counts
  const { data: orderCounts } = await supabase
    .from('orders')
    .select('status');
  
  const pendingOrders = orderCounts?.filter(o => o.status === 'PENDING').length ?? 0;
  const totalOrders = orderCounts?.length ?? 0;

  // customer count
  const { count: customerCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });

  // revenue
  const { data: revenueData } = await supabase
    .from('orders')
    .select('total_minor')
    .in('status', ["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"]);
    
  const revenueMinor = revenueData?.reduce((sum, order) => sum + (order.total_minor || 0), 0) ?? 0;

  // recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('*, customers(profiles(name, email))')
    .order('created_at', { ascending: false })
    .limit(5);

  const productCounts = await adminGetCatalogProductCounts().catch(() => ({
    published: 0,
    draft: 0,
    archived: 0,
    total: 0,
  }));

  const [{ count: lowProductStock }, { count: lowVariantStock }, pendingHandoffs] = await Promise.all([
    supabase
      .from("inventory")
      .select("id", { count: "exact", head: true })
      .lte("stock_quantity", 5),
    supabase
      .from("product_variant_inventory")
      .select("id", { count: "exact", head: true })
      .or("stock_quantity.lte.5,stock_quantity.is.null"),
    supabase
      .from("assistant_handoff_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "PENDING")
      .then(({ count, error }) => {
        if (error) return 0;
        return count ?? 0;
      }),
  ]);

  // recent handoffs
  const { data: recentHandoffs } = await supabase
    .from("assistant_handoff_requests")
    .select("id, issue_summary, status, contact_name, contact_email, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  return {
    products: productCounts,
    orders: { pending: pendingOrders, total: totalOrders },
    customers: customerCount ?? 0,
    revenueMinor,
    lowStockCount: (lowProductStock ?? 0) + (lowVariantStock ?? 0),
    pendingHandoffs,
    recentOrders: recentOrders ?? [],
    recentHandoffs: recentHandoffs ?? [],
  };
}
