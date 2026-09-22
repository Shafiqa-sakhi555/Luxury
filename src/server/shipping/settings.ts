import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_SHIPPING_RATES } from "@/lib/shipping/defaults";
import { isFurnitureKind, isShippingType } from "@/lib/shipping/defaults";
import type {
  FurnitureKind,
  ShippingFurnitureRate,
  ShippingRatesConfig,
  ShippingWeightBand,
} from "@/lib/shipping/types";

function parseBands(rows: Array<Record<string, unknown>> | null): ShippingWeightBand[] {
  if (!rows?.length) return DEFAULT_SHIPPING_RATES.weightBands;
  return rows
    .map((row) => {
      const band: ShippingWeightBand = {
        shippingType: isShippingType(row.shipping_type) && row.shipping_type !== "FURNITURE"
          ? row.shipping_type
          : "COURIER",
        maxWeightKg:
          row.max_weight_kg === null || row.max_weight_kg === undefined
            ? null
            : Number(row.max_weight_kg),
        rateMinor: Math.max(0, Math.round(Number(row.rate_minor) || 0)),
        sortOrder: Number(row.sort_order) || 0,
      };
      if (typeof row.id === "string") band.id = row.id;
      return band;
    })
    .filter((row) => row.shippingType === "COURIER" || row.shippingType === "CARGO");
}

function parseFurniture(rows: Array<Record<string, unknown>> | null): ShippingFurnitureRate[] {
  if (!rows?.length) return DEFAULT_SHIPPING_RATES.furnitureRates;
  const mapped = rows
    .map((row) => ({
      kind: isFurnitureKind(row.kind) ? row.kind : null,
      label: String(row.label ?? ""),
      rateMinor: Math.max(0, Math.round(Number(row.rate_minor) || 0)),
    }))
    .filter((row): row is ShippingFurnitureRate => Boolean(row.kind));

  return DEFAULT_SHIPPING_RATES.furnitureRates.map((fallback) => {
    const match = mapped.find((row) => row.kind === fallback.kind);
    return match ?? fallback;
  });
}

export async function getShippingRates(): Promise<ShippingRatesConfig> {
  try {
    const supabase = createSupabaseAdminClient();
    const [{ data: bands, error: bandError }, { data: furniture, error: furnitureError }, { data: settings }] =
      await Promise.all([
        supabase
          .from("shipping_weight_bands")
          .select("id, shipping_type, max_weight_kg, rate_minor, sort_order")
          .order("shipping_type")
          .order("sort_order"),
        supabase.from("shipping_furniture_rates").select("kind, label, rate_minor"),
        supabase
          .from("store_settings")
          .select("free_delivery_threshold_minor")
          .eq("id", 1)
          .maybeSingle(),
      ]);

    if (bandError || furnitureError) {
      return DEFAULT_SHIPPING_RATES;
    }

    return {
      freeDeliveryThresholdMinor: Math.max(
        0,
        settings?.free_delivery_threshold_minor ??
          DEFAULT_SHIPPING_RATES.freeDeliveryThresholdMinor
      ),
      weightBands: parseBands(bands as Array<Record<string, unknown>> | null),
      furnitureRates: parseFurniture(furniture as Array<Record<string, unknown>> | null),
    };
  } catch {
    return DEFAULT_SHIPPING_RATES;
  }
}

export async function saveShippingRates(input: ShippingRatesConfig & { updatedBy?: string }) {
  const supabase = createSupabaseAdminClient();

  const { error: settingsError } = await supabase.from("store_settings").upsert(
    {
      id: 1,
      free_delivery_threshold_minor: Math.max(0, Math.round(input.freeDeliveryThresholdMinor)),
      updated_at: new Date().toISOString(),
      updated_by: input.updatedBy ?? null,
    },
    { onConflict: "id" }
  );
  if (settingsError) {
    throw new Error(settingsError.message);
  }

  const { error: deleteBandsError } = await supabase
    .from("shipping_weight_bands")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (deleteBandsError) throw new Error(deleteBandsError.message);

  const bandRows = input.weightBands.map((band, index) => ({
    shipping_type: band.shippingType,
    max_weight_kg: band.maxWeightKg,
    rate_minor: Math.max(0, Math.round(band.rateMinor)),
    sort_order: index,
    updated_at: new Date().toISOString(),
  }));

  if (bandRows.length) {
    const { error } = await supabase.from("shipping_weight_bands").insert(bandRows);
    if (error) throw new Error(error.message);
  }

  for (const rate of input.furnitureRates) {
    const kind: FurnitureKind = rate.kind;
    const { error } = await supabase.from("shipping_furniture_rates").upsert(
      {
        kind,
        label: rate.label.trim() || kind,
        rate_minor: Math.max(0, Math.round(rate.rateMinor)),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "kind" }
    );
    if (error) throw new Error(error.message);
  }

  return getShippingRates();
}
