/** Format integer paisa as PKR display string (matches homepage formatPrice) */
export function formatMoney(minor: number, _currency = "PKR"): string {
  const major = minor / 100;
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(major);
}

export function toMinor(major: number): number {
  return Math.round(major * 100);
}

export function toMajor(minor: number): number {
  return minor / 100;
}

export function effectivePriceMinor(
  priceMinor: number,
  salePriceMinor: number | null | undefined
): number {
  return salePriceMinor != null && salePriceMinor > 0 && salePriceMinor < priceMinor
    ? salePriceMinor
    : priceMinor;
}

export type CartPriceSources = {
  priceSnapshotMinor?: number | null;
  variantPriceMinor?: number | null;
  variantSalePriceMinor?: number | null;
  productOriginalPriceMinor?: number | null;
  productSalePriceMinor?: number | null;
};

/** True when `value` looks like major units or stale data vs a trusted reference price. */
function isMisscaledMinor(value: number, reference: number): boolean {
  return reference > 0 && value > 0 && value < reference / 50;
}

/**
 * Resolve cart line unit price in paisa. Product-level prices win when variant
 * or snapshot values are clearly out of sync (e.g. 500 vs 500000).
 */
export function resolveCartItemPriceMinor(sources: CartPriceSources): number {
  const productOriginal = sources.productOriginalPriceMinor ?? 0;
  const productSale = sources.productSalePriceMinor ?? 0;
  const variantOriginal = sources.variantPriceMinor ?? 0;
  const variantSale = sources.variantSalePriceMinor ?? 0;
  const snapshot = sources.priceSnapshotMinor ?? 0;

  const canonical = effectivePriceMinor(
    productOriginal || variantOriginal,
    productSale > 0 ? productSale : variantSale > 0 ? variantSale : null
  );

  const variantBased = effectivePriceMinor(
    variantOriginal || productOriginal,
    variantSale > 0 ? variantSale : null
  );

  if (canonical > 0) {
    if (
      isMisscaledMinor(variantBased, canonical) ||
      isMisscaledMinor(snapshot, canonical)
    ) {
      return canonical;
    }
  }

  if (snapshot > 0) return snapshot;
  if (variantBased > 0) return variantBased;
  return canonical;
}
