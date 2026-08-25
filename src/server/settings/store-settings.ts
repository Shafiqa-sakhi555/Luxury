import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const DEFAULT_DELIVERY_FEE_MINOR = 250_000;
export const DEFAULT_FREE_DELIVERY_THRESHOLD_MINOR = 5_000_000;

export type StoreSettings = {
  deliveryFeeMinor: number;
  freeDeliveryThresholdMinor: number;
};

export function deliveryFeeForSubtotal(
  subtotalMinor: number,
  settings: StoreSettings
): number {
  if (
    settings.freeDeliveryThresholdMinor > 0 &&
    subtotalMinor >= settings.freeDeliveryThresholdMinor
  ) {
    return 0;
  }
  return Math.max(0, settings.deliveryFeeMinor);
}

export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("store_settings")
      .select("delivery_fee_minor, free_delivery_threshold_minor")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) {
      return {
        deliveryFeeMinor: DEFAULT_DELIVERY_FEE_MINOR,
        freeDeliveryThresholdMinor: DEFAULT_FREE_DELIVERY_THRESHOLD_MINOR,
      };
    }

    return {
      deliveryFeeMinor: Math.max(0, data.delivery_fee_minor ?? DEFAULT_DELIVERY_FEE_MINOR),
      freeDeliveryThresholdMinor: Math.max(
        0,
        data.free_delivery_threshold_minor ?? DEFAULT_FREE_DELIVERY_THRESHOLD_MINOR
      ),
    };
  } catch {
    return {
      deliveryFeeMinor: DEFAULT_DELIVERY_FEE_MINOR,
      freeDeliveryThresholdMinor: DEFAULT_FREE_DELIVERY_THRESHOLD_MINOR,
    };
  }
}

export async function updateStoreSettings(
  input: StoreSettings & { updatedBy?: string }
): Promise<StoreSettings> {
  const supabase = createSupabaseAdminClient();
  const payload = {
    id: 1,
    delivery_fee_minor: Math.max(0, Math.round(input.deliveryFeeMinor)),
    free_delivery_threshold_minor: Math.max(0, Math.round(input.freeDeliveryThresholdMinor)),
    updated_at: new Date().toISOString(),
    updated_by: input.updatedBy ?? null,
  };

  const { data, error } = await supabase
    .from("store_settings")
    .upsert(payload, { onConflict: "id" })
    .select("delivery_fee_minor, free_delivery_threshold_minor")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not save store settings.");
  }

  return {
    deliveryFeeMinor: data.delivery_fee_minor,
    freeDeliveryThresholdMinor: data.free_delivery_threshold_minor,
  };
}
