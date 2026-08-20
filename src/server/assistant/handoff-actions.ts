"use server";

import { revalidatePath } from "next/cache";
import { HANDOFF_STATUS_OPTIONS } from "@/lib/admin/status-badges";
import { adminUpdateHandoffStatus } from "@/server/assistant/handoffs-admin";
import { writeAuditLog } from "@/server/audit";
import { AuthorizationError, requirePermission } from "@/server/rbac";

export async function updateHandoffStatusAction(input: { handoffId: string; status: string }) {
  try {
    const user = await requirePermission("customer.read");

    if (!HANDOFF_STATUS_OPTIONS.includes(input.status as (typeof HANDOFF_STATUS_OPTIONS)[number])) {
      return { ok: false as const, error: "Invalid status." };
    }

    await adminUpdateHandoffStatus(input.handoffId, input.status);

    await writeAuditLog({
      actorId: user.id,
      action: "assistant.handoff_status_update",
      entityType: "AssistantHandoff",
      entityId: input.handoffId,
      after: { status: input.status },
    });

    revalidatePath("/admin/assistant");
    revalidatePath(`/admin/assistant/${input.handoffId}`);
    revalidatePath("/admin");

    return { ok: true as const };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false as const, error: error.message };
    }
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to update handoff.",
    };
  }
}
