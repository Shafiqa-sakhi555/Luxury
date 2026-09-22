import { toMinor } from "@/lib/money";
import type {
  FurnitureKind,
  ShippingRatesConfig,
  ShippingType,
} from "@/lib/shipping/types";

/** Bundled seed values — checkout always prefers database rates. */
export const DEFAULT_FREE_DELIVERY_THRESHOLD_MAJOR = 200_000;

export const DEFAULT_SHIPPING_RATES: ShippingRatesConfig = {
  freeDeliveryThresholdMinor: toMinor(DEFAULT_FREE_DELIVERY_THRESHOLD_MAJOR),
  weightBands: [
    { shippingType: "COURIER", maxWeightKg: 1, rateMinor: toMinor(250), sortOrder: 0 },
    { shippingType: "COURIER", maxWeightKg: 3, rateMinor: toMinor(400), sortOrder: 1 },
    { shippingType: "COURIER", maxWeightKg: 5, rateMinor: toMinor(600), sortOrder: 2 },
    { shippingType: "COURIER", maxWeightKg: 10, rateMinor: toMinor(900), sortOrder: 3 },
    { shippingType: "COURIER", maxWeightKg: null, rateMinor: toMinor(1200), sortOrder: 4 },
    { shippingType: "CARGO", maxWeightKg: 10, rateMinor: toMinor(1000), sortOrder: 0 },
    { shippingType: "CARGO", maxWeightKg: 20, rateMinor: toMinor(1500), sortOrder: 1 },
    { shippingType: "CARGO", maxWeightKg: 30, rateMinor: toMinor(2000), sortOrder: 2 },
    { shippingType: "CARGO", maxWeightKg: 40, rateMinor: toMinor(2500), sortOrder: 3 },
    { shippingType: "CARGO", maxWeightKg: null, rateMinor: toMinor(3500), sortOrder: 4 },
  ],
  furnitureRates: [
    { kind: "sofa", label: "Sofa delivery", rateMinor: toMinor(5000) },
    { kind: "dining_set", label: "Dining set", rateMinor: toMinor(6000) },
    { kind: "room_set", label: "Room set", rateMinor: toMinor(7000) },
    { kind: "bed_set", label: "Bed set", rateMinor: toMinor(5000) },
    { kind: "default", label: "Large furniture", rateMinor: toMinor(5000) },
  ],
};

export const SHIPPING_TYPE_LABELS: Record<ShippingType, string> = {
  COURIER: "Courier shipping",
  CARGO: "Cargo shipping",
  FURNITURE: "Furniture shipping",
};

export const FURNITURE_KIND_LABELS: Record<FurnitureKind, string> = {
  sofa: "Sofa",
  dining_set: "Dining set",
  room_set: "Room set",
  bed_set: "Bed set",
  default: "Large furniture",
};

export const DEFAULT_WEIGHT_KG: Record<ShippingType, number> = {
  COURIER: 0.5,
  CARGO: 15,
  FURNITURE: 50,
};

const CLASSIFICATION_RULES: Array<{
  type: ShippingType;
  furnitureKind?: FurnitureKind;
  pattern: RegExp;
}> = [
  {
    type: "COURIER",
    pattern: /towel|prayer|janamaz|pillow|cushion|curtain|blanket|quilt|bed[- ]?sheet|linen/i,
  },
  { type: "CARGO", pattern: /runner|carpet|rug|mirror/i },
  { type: "FURNITURE", furnitureKind: "sofa", pattern: /sofa|seater|settee|dewan/i },
  { type: "FURNITURE", furnitureKind: "dining_set", pattern: /dining/i },
  { type: "FURNITURE", furnitureKind: "room_set", pattern: /room[- ]?set/i },
  { type: "FURNITURE", furnitureKind: "bed_set", pattern: /bed[- ]?set|bedroom/i },
  {
    type: "FURNITURE",
    furnitureKind: "default",
    pattern: /rocking|coffee[- ]?table|furniture|chair|table/i,
  },
];

export function inferShippingClassification(
  slug?: string | null,
  name?: string | null
): { type: ShippingType; furnitureKind: FurnitureKind | null } {
  const haystack = `${slug ?? ""} ${name ?? ""}`.trim();
  if (!haystack) return { type: "COURIER", furnitureKind: null };

  for (const rule of CLASSIFICATION_RULES) {
    if (rule.pattern.test(haystack)) {
      return {
        type: rule.type,
        furnitureKind: rule.furnitureKind ?? null,
      };
    }
  }

  return { type: "COURIER", furnitureKind: null };
}

export function isShippingType(value: unknown): value is ShippingType {
  return value === "COURIER" || value === "CARGO" || value === "FURNITURE";
}

export function isFurnitureKind(value: unknown): value is FurnitureKind {
  return (
    value === "sofa" ||
    value === "dining_set" ||
    value === "room_set" ||
    value === "bed_set" ||
    value === "default"
  );
}
