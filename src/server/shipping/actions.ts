"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { AuthorizationError, requirePermission } from "@/server/rbac";
import { toMinor } from "@/lib/money";
import { saveShippingRates } from "@/server/shipping/settings";

const bandSchema = z.object({
  shippingType: z.enum(["COURIER", "CARGO"]),
  maxWeightKg: z.number().positive().nullable(),
  rateMajor: z.number().min(0),
});

const furnitureSchema = z.object({
  kind: z.enum(["sofa", "dining_set", "room_set", "bed_set", "default"]),
  label: z.string().min(1).max(80),
  rateMajor: z.number().min(0),
});

const schema = z.object({
  freeDeliveryThresholdMajor: z.number().min(0),
  courierBands: z.array(bandSchema).min(1),
  cargoBands: z.array(bandSchema).min(1),
  furnitureRates: z.array(furnitureSchema).min(1),
});

export async function saveShippingSettingsAction(input: z.infer<typeof schema>) {
  try {
    const user = await requirePermission("catalog.write");
    const values = schema.parse(input);

    await saveShippingRates({
      updatedBy: user.id,
      freeDeliveryThresholdMinor: toMinor(values.freeDeliveryThresholdMajor),
      weightBands: [
        ...values.courierBands.map((band, index) => ({
          shippingType: "COURIER" as const,
          maxWeightKg: band.maxWeightKg,
          rateMinor: toMinor(band.rateMajor),
          sortOrder: index,
        })),
        ...values.cargoBands.map((band, index) => ({
          shippingType: "CARGO" as const,
          maxWeightKg: band.maxWeightKg,
          rateMinor: toMinor(band.rateMajor),
          sortOrder: index,
        })),
      ],
      furnitureRates: values.furnitureRates.map((rate) => ({
        kind: rate.kind,
        label: rate.label,
        rateMinor: toMinor(rate.rateMajor),
      })),
    });

    revalidatePath("/admin/shipping");
    revalidatePath("/admin/settings");
    revalidatePath("/", "layout");
    revalidatePath("/cart");
    revalidatePath("/checkout");
    revalidatePath("/delivery");

    return { ok: true as const };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false as const, error: error.message };
    }
    if (error instanceof z.ZodError) {
      return { ok: false as const, error: error.issues[0]?.message ?? "Invalid shipping rates." };
    }
    const message = error instanceof Error ? error.message : "Could not save shipping settings.";
    if (/shipping_weight_bands|shipping_furniture_rates|schema cache|does not exist/i.test(message)) {
      return {
        ok: false as const,
        error: "Shipping tables are missing. Run supabase/migrations/018_shipping_system.sql in Supabase, then try again.",
      };
    }
    return { ok: false as const, error: message };
  }
}
