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
