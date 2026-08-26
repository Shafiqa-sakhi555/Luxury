"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { AuthorizationError, requirePermission } from "@/server/rbac";
import { toMinor } from "@/lib/money";
import { updateStoreSettings } from "@/server/settings/store-settings";

const schema = z.object({
  deliveryFeeMajor: z.coerce.number().min(0, "Delivery fee cannot be negative"),
  freeDeliveryThresholdMajor: z.coerce.number().min(0, "Threshold cannot be negative"),
});

export async function saveStoreSettingsAction(input: {
  deliveryFeeMajor: number;
  freeDeliveryThresholdMajor: number;
}) {
  try {
    const user = await requirePermission("catalog.write");
    const values = schema.parse(input);

    await updateStoreSettings({
      deliveryFeeMinor: toMinor(values.deliveryFeeMajor),
      freeDeliveryThresholdMinor: toMinor(values.freeDeliveryThresholdMajor),
      updatedBy: user.id,
    });

    revalidatePath("/admin/settings");
    revalidatePath("/", "layout");
    revalidatePath("/cart");
    revalidatePath("/checkout");
    revalidatePath("/delivery");
    revalidatePath("/products", "layout");

    return {
      ok: true as const,
      deliveryFeeMajor: values.deliveryFeeMajor,
      freeDeliveryThresholdMajor: values.freeDeliveryThresholdMajor,
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false as const, error: error.message };
    }
    if (error instanceof z.ZodError) {
      return { ok: false as const, error: error.issues[0]?.message ?? "Invalid values." };
    }
    const message = error instanceof Error ? error.message : "Could not save settings.";
    if (/store_settings|schema cache|does not exist/i.test(message)) {
      return {
        ok: false as const,
        error: "Delivery settings table is missing. Run the store_settings SQL in Supabase, then try again.",
      };
    }
    return { ok: false as const, error: message };
  }
}
