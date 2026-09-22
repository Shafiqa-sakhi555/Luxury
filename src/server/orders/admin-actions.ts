"use server";

import { revalidatePath } from "next/cache";
import { AuthorizationError, requirePermission } from "@/server/rbac";
import { writeAuditLog } from "@/server/audit";
import { updateOrderStatus } from "@/server/orders";

export async function updateOrderStatusAction(input: {
  orderId: string;
  status: string;
  reason?: string;
}) {
  try {
    const user = await requirePermission("order.write");

    await updateOrderStatus(input.orderId, input.status, input.reason, user.id);

    await writeAuditLog({
      actorId: user.id,
      action: "order.status_update",
      entityType: "Order",
      entityId: input.orderId,
      after: { status: input.status, reason: input.reason ?? null },
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${input.orderId}`);
    revalidatePath("/admin");

    return { ok: true as const };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false as const, error: error.message };
    }
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to update order.",
    };
  }
}

export async function deleteOrderAction(orderId: string) {
  try {
    const user = await requirePermission("order.write");

    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createSupabaseAdminClient();

    // Fetch order number for audit log before deletion
    const { data: order } = await supabase
      .from("orders")
      .select("order_number")
      .eq("id", orderId)
      .maybeSingle();

    if (!order) {
      return { ok: false as const, error: "Order not found." };
    }

    // Delete cascading child records first
    await supabase.from("order_status_history").delete().eq("order_id", orderId);
    await supabase.from("order_items").delete().eq("order_id", orderId);
    const { error } = await supabase.from("orders").delete().eq("id", orderId);

    if (error) {
      return { ok: false as const, error: error.message };
    }

    await writeAuditLog({
      actorId: user.id,
      action: "order.delete",
      entityType: "Order",
      entityId: orderId,
      before: { order_number: order.order_number },
    });

    revalidatePath("/admin/orders");
    revalidatePath("/admin");

    return { ok: true as const };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false as const, error: error.message };
    }
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to delete order.",
    };
  }
}
