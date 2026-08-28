import type { CatalogProduct, CatalogProductVariant } from "@/types/catalog";

export type ProductSizeOption = {
  id: string;
  label: string;
  sublabel?: string | null;
};

function formatCustomSizeLabel(variant: CatalogProductVariant): string | null {
  const customLabel = variant.attributes?.customLabel?.trim();
  if (customLabel) return customLabel;

  const width = variant.customWidth;
  const length = variant.customLength;
  const wUnit = variant.customWidthUnit ?? "ft";
  const lUnit = variant.customLengthUnit ?? "ft";
  if (width && length) return `${width} ${wUnit} × ${length} ${lUnit}`;
  return null;
}

function buildSizeSublabel(variant: CatalogProductVariant): string | null {
  if (variant.stockStatus === "out_of_stock") return "Out of stock";

  const pieces = variant.attributes?.pieces?.trim();
  if (pieces) return `${pieces}-piece set`;

  if (variant.dimensions?.trim()) return variant.dimensions.trim();
  if (variant.weight?.trim()) return variant.weight.trim();

  return null;
}

/** Build selectable size options from product variants. */
export function parseProductSizes(product: CatalogProduct): ProductSizeOption[] {
  const sizes = new Map<string, ProductSizeOption>();
  const variants = product.variants ?? [];

  for (const variant of variants) {
    const customLabel = formatCustomSizeLabel(variant);
    const label = customLabel ?? variant.size?.trim();
    if (!label) continue;

    const id = variant.categorySizeId ?? label;
    if (!sizes.has(id)) {
      sizes.set(id, {
        id: label,
        label,
        sublabel: buildSizeSublabel(variant),
      });
    }
  }

  if (sizes.size === 0 && product.size?.trim()) {
    const label = product.size.trim();
    sizes.set(label, { id: label, label });
  }

  return [...sizes.values()];
}

export function productHasSizeOptions(product: CatalogProduct): boolean {
  return parseProductSizes(product).length > 0;
}

export function productUsesVariantSelector(product: CatalogProduct): boolean {
  const variants = product.variants ?? [];
  if (variants.length === 0) return false;
  if (variants.length > 1) return true;
  if (variants.some((variant) => variant.categorySizeId)) return true;
  if (product.hasVariants) return true;
  return false;
}

export function pickProductVariant(
  variants: CatalogProductVariant[],
  colorId: string,
  sizeId: string
): CatalogProductVariant | undefined {
  return (
    variants.find((variant) => {
      const sizeMatch = !sizeId || variant.size === sizeId;
      const colorMatch = !colorId || !variant.color || variant.color === colorId;
      return sizeMatch && colorMatch;
    }) ??
    variants.find((variant) => !sizeId || variant.size === sizeId) ??
    variants[0]
  );
}
