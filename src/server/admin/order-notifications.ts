import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatMoney } from "@/lib/money";
import type { AdminContext } from "@/server/rbac";
import { hasAnyPermission } from "@/server/rbac";

export type AdminOrderNotification = {
  id: string;
  orderNumber: string;
  customerName: string;
  totalLabel: string;
  status: string;
  createdAt: string;
  unread: boolean;
};

export function canViewOrderNotifications(ctx: AdminContext) {
  if (ctx.primaryRole !== "Super Admin" && ctx.primaryRole !== "Admin") return false;
  return hasAnyPermission(ctx.permissions, ["order.read"]);
}

async function getOrdersSeenAt(userId: string): Promise<string | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("admin_inbox_state")
      .select("orders_seen_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data?.orders_seen_at) return null;
    return data.orders_seen_at;
  } catch {
    return null;
  }
}

export async function listAdminOrderNotifications(
  userId: string,
  seenHint?: string | null
): Promise<{
  items: AdminOrderNotification[];
  unreadCount: number;
}> {
  const supabase = createSupabaseAdminClient();
  const dbSeenAt = await getOrdersSeenAt(userId);
  const hintTime = seenHint ? Date.parse(seenHint) : Number.NaN;
  const dbTime = dbSeenAt ? Date.parse(dbSeenAt) : Number.NaN;
  const seenTime = [hintTime, dbTime].filter((value) => Number.isFinite(value)).sort((a, b) => b - a)[0] ?? null;
  const seenAtIso = seenTime != null ? new Date(seenTime).toISOString() : null;

  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, total_minor, created_at, shipping_name, customers(profiles(name))")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("listAdminOrderNotifications:", error.message);
    return { items: [], unreadCount: 0 };
  }

  const items = (data ?? []).map((row: Record<string, unknown>) => {
    const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
    const related = customer as { profiles?: { name?: string | null } | { name?: string | null }[] } | null;
    const profile = Array.isArray(related?.profiles) ? related?.profiles[0] : related?.profiles;
    const createdAt = String(row.created_at ?? "");
    const unread = seenTime == null ? row.status === "PENDING" : Date.parse(createdAt) > seenTime;

    return {
      id: String(row.id ?? ""),
      orderNumber: String(row.order_number ?? "Order"),
      customerName: profile?.name || String(row.shipping_name ?? "") || "Customer",
      totalLabel: formatMoney(Number(row.total_minor ?? 0)),
      status: String(row.status ?? "PENDING"),
      createdAt,
      unread,
    };
  });

  let unreadCount = items.filter((item) => item.unread).length;
  if (seenAtIso) {
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gt("created_at", seenAtIso);
    unreadCount = count ?? unreadCount;
  } else {
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "PENDING");
    unreadCount = count ?? unreadCount;
  }

  return { items, unreadCount };
}

export async function markAdminOrderNotificationsSeen(userId: string) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("admin_inbox_state").upsert(
    {
      user_id: userId,
      orders_seen_at: now,
      updated_at: now,
    },
    { onConflict: "user_id" }
  );

  if (error && !/schema cache|does not exist|admin_inbox_state/i.test(error.message)) {
    throw new Error(error.message);
  }
}
