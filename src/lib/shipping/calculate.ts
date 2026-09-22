import {
  DEFAULT_SHIPPING_RATES,
  DEFAULT_WEIGHT_KG,
  FURNITURE_KIND_LABELS,
  SHIPPING_TYPE_LABELS,
  inferShippingClassification,
  isFurnitureKind,
  isShippingType,
} from "@/lib/shipping/defaults";
import type {
  FurnitureKind,
  ShippingCartItem,
  ShippingGroupQuote,
  ShippingQuote,
  ShippingRatesConfig,
  ShippingType,
  ShippingWeightBand,
} from "@/lib/shipping/types";

export function emptyShippingQuote(): ShippingQuote {
  return {
    groups: [],
    shippingBeforeDiscountMinor: 0,
    freeDeliveryApplied: false,
    freeDeliveryDiscountMinor: 0,
    shippingMinor: 0,
  };
}

export function rateForWeight(bands: ShippingWeightBand[], weightKg: number): number {
  const sorted = [...bands].sort((a, b) => {
    if (a.maxWeightKg == null) return 1;
    if (b.maxWeightKg == null) return -1;
    return a.maxWeightKg - b.maxWeightKg;
  });

  for (const band of sorted) {
    if (band.maxWeightKg == null || weightKg <= band.maxWeightKg) {
      return Math.max(0, Math.round(band.rateMinor));
    }
  }

  return Math.max(0, Math.round(sorted.at(-1)?.rateMinor ?? 0));
}

function furnitureRate(
  rates: ShippingRatesConfig["furnitureRates"],
  kind: FurnitureKind | null | undefined
): number {
  const match =
    rates.find((row) => row.kind === (kind ?? "default")) ??
    rates.find((row) => row.kind === "default");
  return Math.max(0, Math.round(match?.rateMinor ?? 0));
}

/**
 * Group cart lines by shipping type, combine weight per group, then price
 * one shipment per type. Furniture uses the highest furniture rate in the group
 * (one delivery), not a per-item charge.
 */
export function calculateShippingQuote(
  items: ShippingCartItem[],
  rates: ShippingRatesConfig = DEFAULT_SHIPPING_RATES,
  subtotalMinor = 0
): ShippingQuote {
  const groups = new Map<
    ShippingType,
    { weightKg: number; itemCount: number; furnitureKinds: FurnitureKind[] }
  >();

  for (const item of items) {
    if (item.quantity <= 0) continue;
    const type = isShippingType(item.shippingType) ? item.shippingType : "COURIER";
    const weight = Math.max(0, Number(item.weightKg) || DEFAULT_WEIGHT_KG[type]);
    const current = groups.get(type) ?? { weightKg: 0, itemCount: 0, furnitureKinds: [] };
    current.weightKg += weight * item.quantity;
    current.itemCount += item.quantity;
    if (type === "FURNITURE") {
      const kind = isFurnitureKind(item.furnitureKind) ? item.furnitureKind : "default";
      current.furnitureKinds.push(kind);
    }
    groups.set(type, current);
  }

  const quotes: ShippingGroupQuote[] = [];

  for (const type of ["COURIER", "CARGO", "FURNITURE"] as const) {
    const group = groups.get(type);
    if (!group) continue;

    let chargeMinor = 0;
    let furnitureKind: FurnitureKind | null = null;

    if (type === "FURNITURE") {
      const uniqueKinds = [...new Set(group.furnitureKinds)];
      furnitureKind = uniqueKinds.reduce<FurnitureKind>((best, kind) => {
        return furnitureRate(rates.furnitureRates, kind) >
          furnitureRate(rates.furnitureRates, best)
          ? kind
          : best;
      }, uniqueKinds[0] ?? "default");
      chargeMinor = furnitureRate(rates.furnitureRates, furnitureKind);
    } else {
      const bands = rates.weightBands.filter((band) => band.shippingType === type);
      chargeMinor = rateForWeight(bands, group.weightKg);
    }

    quotes.push({
      type,
      label:
        type === "FURNITURE" && furnitureKind
          ? `${SHIPPING_TYPE_LABELS.FURNITURE} (${FURNITURE_KIND_LABELS[furnitureKind]})`
          : SHIPPING_TYPE_LABELS[type],
      itemCount: group.itemCount,
      weightKg: Math.round(group.weightKg * 1000) / 1000,
      chargeMinor,
      furnitureKind,
    });
  }

  const shippingBeforeDiscountMinor = quotes.reduce((sum, row) => sum + row.chargeMinor, 0);
  const threshold = Math.max(0, rates.freeDeliveryThresholdMinor);
  const freeDeliveryApplied = threshold > 0 && subtotalMinor >= threshold;
  const shippingMinor = freeDeliveryApplied ? 0 : shippingBeforeDiscountMinor;

  return {
    groups: quotes,
    shippingBeforeDiscountMinor,
    freeDeliveryApplied,
    freeDeliveryDiscountMinor: freeDeliveryApplied ? shippingBeforeDiscountMinor : 0,
    shippingMinor,
  };
}

export function resolveProductShipping(input: {
  shippingType?: string | null;
  shippingWeightKg?: number | null;
  furnitureKind?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
  productName?: string | null;
}): { type: ShippingType; weightKg: number; furnitureKind: FurnitureKind | null } {
  const inferred = inferShippingClassification(
    input.categorySlug,
    `${input.categoryName ?? ""} ${input.productName ?? ""}`
  );
  const type = isShippingType(input.shippingType) ? input.shippingType : inferred.type;
  const furnitureKind =
    type === "FURNITURE"
      ? isFurnitureKind(input.furnitureKind)
        ? input.furnitureKind
        : inferred.furnitureKind ?? "default"
      : null;
  const parsedWeight = Number(input.shippingWeightKg);
  const weightKg =
    Number.isFinite(parsedWeight) && parsedWeight > 0
      ? parsedWeight
      : DEFAULT_WEIGHT_KG[type];

  return { type, weightKg, furnitureKind };
}
