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
  return salePriceMinor != null && salePriceMinor < priceMinor
    ? salePriceMinor
    : priceMinor;
}
