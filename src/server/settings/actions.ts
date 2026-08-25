"use server";

import { revalidatePath } from "next/cache";
import { AuthorizationError, requirePermission } from "@/server/rbac";
import { writeAuditLog } from "@/server/audit";
import { toMinor } from "@/lib/money";
import { getStoreSettings, updateStoreSettings } from "@/server/settings/store-settings";

function parseRupees(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return toMinor(amount);
}

export async function updateDeliverySettingsAction(formData: FormData) {
  try {
    const user = await requirePermission("settings.write");
    const deliveryFeeMinor = parseRupees(String(formData.get("deliveryFee") ?? ""));
    const freeDeliveryThresholdMinor = parseRupees(
      String(formData.get("freeDeliveryThreshold") ?? "")
    );

    if (deliveryFeeMinor == null) {
      return { ok: false as const, error: "Enter a valid delivery fee in rupees." };
    }
    if (freeDeliveryThresholdMinor == null) {
      return { ok: false as const, error: "Enter a valid free-delivery threshold in rupees." };
    }

    const before = await getStoreSettings();
    const after = await updateStoreSettings({
      deliveryFeeMinor,
      freeDeliveryThresholdMinor,
      updatedBy: user.id,
    });

    await writeAuditLog({
      actorId: user.id,
      action: "settings.delivery_updated",
      entityType: "StoreSettings",
      entityId: "1",
      before,
      after,
    });

    revalidatePath("/admin/settings");
    revalidatePath("/cart");
    revalidatePath("/checkout");
    revalidatePath("/delivery");

    return { ok: true as const };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false as const, error: error.message };
    }
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Could not save delivery settings.",
    };
  }
}
