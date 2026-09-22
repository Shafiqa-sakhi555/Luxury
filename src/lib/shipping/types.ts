export const SHIPPING_TYPES = ["COURIER", "CARGO", "FURNITURE"] as const;
export type ShippingType = (typeof SHIPPING_TYPES)[number];

export const FURNITURE_KINDS = ["sofa", "dining_set", "room_set", "bed_set", "default"] as const;
export type FurnitureKind = (typeof FURNITURE_KINDS)[number];

export type ShippingWeightBand = {
  id?: string;
  shippingType: "COURIER" | "CARGO";
  /** Inclusive upper bound in kg. `null` means this band covers everything above the previous max. */
  maxWeightKg: number | null;
  rateMinor: number;
  sortOrder: number;
};

export type ShippingFurnitureRate = {
  kind: FurnitureKind;
  label: string;
  rateMinor: number;
};

export type ShippingRatesConfig = {
  freeDeliveryThresholdMinor: number;
  weightBands: ShippingWeightBand[];
  furnitureRates: ShippingFurnitureRate[];
};

export type ShippingCartItem = {
  productId?: string;
  name?: string;
  quantity: number;
  shippingType: ShippingType;
  weightKg: number;
  furnitureKind?: FurnitureKind | null;
};

export type ShippingGroupQuote = {
  type: ShippingType;
  label: string;
  itemCount: number;
  weightKg: number;
  chargeMinor: number;
  furnitureKind?: FurnitureKind | null;
};

export type ShippingQuote = {
  groups: ShippingGroupQuote[];
  shippingBeforeDiscountMinor: number;
  freeDeliveryApplied: boolean;
  freeDeliveryDiscountMinor: number;
  shippingMinor: number;
};

export type CartTotals = {
  subtotalMinor: number;
  deliveryMinor: number;
  totalMinor: number;
  itemCount: number;
  shipping: ShippingQuote;
};
