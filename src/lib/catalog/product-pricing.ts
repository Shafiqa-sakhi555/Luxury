import { formatMoney, toMinor } from "@/lib/money";

type PriceInput = {
  salePriceMinor: number;
  originalPriceMinor: number;
  sellingUnit?: string | null;
  categorySlug?: string | null;
  size?: string | null;
};

const SQ_FT_UNIT_PATTERN =
  /\b(sq\.?\s*ft|sq\.?\s*feet|square\s*foot|square\s*feet|sqr\.?\s*feet|per\s*sq|\/\s*sq)\b/i;

const NUMERIC_RATE_PATTERN = /^\d+(\.\d+)?$/;

export function isNumericRateValue(value?: string | null) {
  if (!value) return false;
  return NUMERIC_RATE_PATTERN.test(value.trim());
}

export function parseNumericRateMajor(value?: string | null): number | null {
  if (!value || !isNumericRateValue(value)) return null;
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function isSquareFootPricing(input: PriceInput) {
  const unit = input.sellingUnit?.trim() ?? "";
  if (unit && SQ_FT_UNIT_PATTERN.test(unit)) return true;
  if (isNumericRateValue(unit)) return true;

  return false;
}

export function usesSquareFootSellingUnit(sellingUnit?: string | null) {
  return isSquareFootPricing({
    salePriceMinor: 0,
    originalPriceMinor: 0,
    sellingUnit,
  });
}

export function squareFootUnitLabel(sellingUnit?: string | null) {
  const unit = sellingUnit?.trim() ?? "";
  if (!unit || isNumericRateValue(unit)) return "per sq ft";
  if (SQ_FT_UNIT_PATTERN.test(unit)) {
    return unit.replace(/^sold by the\s+/i, "").trim() || "per sq ft";
  }
  return unit;
}

/** Resolve display prices; supports legacy data where rate was stored in selling_unit. */
export function resolveProductPriceMinor(input: PriceInput) {
  let salePriceMinor = input.salePriceMinor;
  let originalPriceMinor = input.originalPriceMinor;

  if (salePriceMinor <= 0 && originalPriceMinor <= 0) {
    const legacyRate = parseNumericRateMajor(input.sellingUnit);
    if (legacyRate != null) {
      salePriceMinor = toMinor(legacyRate);
      originalPriceMinor = salePriceMinor;
    }
  }

  if (salePriceMinor <= 0 && originalPriceMinor > 0) {
    salePriceMinor = originalPriceMinor;
  }

  return { salePriceMinor, originalPriceMinor };
}

export function computeDiscountPercentage(originalPriceMinor: number, salePriceMinor: number) {
  if (originalPriceMinor <= 0 || salePriceMinor <= 0 || salePriceMinor >= originalPriceMinor) {
    return 0;
  }
  return Math.round((1 - salePriceMinor / originalPriceMinor) * 100);
}

export function resolveProductDiscountPercentage(input: PriceInput) {
  const { salePriceMinor, originalPriceMinor } = resolveProductPriceMinor(input);
  return computeDiscountPercentage(originalPriceMinor, salePriceMinor);
}

export function formatProductPriceDisplay(
  input: PriceInput & { prefix?: string | null }
): {
  primary: string;
  compareAt?: string;
  unitLabel?: string;
  showFromPrefix: boolean;
  discountPercentage: number;
} {
  const { salePriceMinor, originalPriceMinor } = resolveProductPriceMinor(input);
  const perSquareFoot = isSquareFootPricing(input);
  const discountPercentage = computeDiscountPercentage(originalPriceMinor, salePriceMinor);
  const hasDiscount = discountPercentage > 0;
  const unitLabel = perSquareFoot ? squareFootUnitLabel(input.sellingUnit) : undefined;
  const suffix = unitLabel ? ` / ${unitLabel.replace(/^per\s+/i, "")}` : "";

  if (salePriceMinor <= 0) {
    return {
      primary: perSquareFoot ? "Price on request" : formatMoney(0),
      unitLabel: unitLabel ?? undefined,
      showFromPrefix: false,
      discountPercentage: 0,
    };
  }

  const primary = `${formatMoney(salePriceMinor)}${suffix}`;
  const compareAt = hasDiscount ? `${formatMoney(originalPriceMinor)}${suffix}` : undefined;

  return {
    primary,
    compareAt,
    unitLabel,
    showFromPrefix: Boolean(input.prefix),
    discountPercentage,
  };
}

export function productSellingUnitSubtitle(input: PriceInput) {
  const unit = input.sellingUnit?.trim();
  if (!unit || isNumericRateValue(unit)) {
    return isSquareFootPricing(input) ? "Price varies by size · sold per sq ft" : null;
  }
  return unit;
}

export function salePriceMajorFromDiscount(originalPriceMajor: number, discountPercent: number) {
  if (originalPriceMajor <= 0 || discountPercent <= 0) return 0;
  if (discountPercent >= 100) return 0;
  return Math.round(originalPriceMajor * (1 - discountPercent / 100) * 100) / 100;
}

export function normalizeAdminProductPricing(input: {
  originalPriceMajor: number;
  salePriceMajor: number;
  sellingUnit: string;
  pricePerSquareFoot?: boolean;
}) {
  let originalPriceMajor = input.originalPriceMajor;
  let salePriceMajor = input.salePriceMajor;
  let sellingUnit = input.sellingUnit.trim();

  const perSquareFoot =
    input.pricePerSquareFoot === true ||
    isSquareFootPricing({
      salePriceMinor: toMinor(salePriceMajor || originalPriceMajor),
      originalPriceMinor: toMinor(originalPriceMajor),
      sellingUnit,
    });

  if (originalPriceMajor <= 0 && salePriceMajor <= 0) {
    const legacyRate = parseNumericRateMajor(sellingUnit);
    if (legacyRate != null) {
      originalPriceMajor = legacyRate;
      salePriceMajor = legacyRate;
      sellingUnit = "per sq ft";
    }
  } else if (perSquareFoot) {
    if (isNumericRateValue(sellingUnit)) {
      sellingUnit = "per sq ft";
    } else if (!sellingUnit || input.pricePerSquareFoot) {
      sellingUnit = "per sq ft";
    }
  } else if (sellingUnit.toLowerCase() === "per sq ft") {
    sellingUnit = "";
  }

  return { originalPriceMajor, salePriceMajor, sellingUnit };
}
