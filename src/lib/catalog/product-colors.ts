import type { CatalogProduct } from "@/types/catalog";

export type ProductColorOption = {
  id: string;
  label: string;
};

/** Parse comma-separated colors from product specifications and variant rows. */
export function parseProductColors(product: CatalogProduct): ProductColorOption[] {
  const colors = new Map<string, ProductColorOption>();

  const colorsSpec = product.specifications.find((spec) => spec.key === "colors");
  if (colorsSpec?.value) {
    for (const label of colorsSpec.value.split(",").map((entry) => entry.trim()).filter(Boolean)) {
      if (!colors.has(label)) colors.set(label, { id: label, label });
    }
  }

  for (const variant of product.variants ?? []) {
    const label = variant.color?.trim();
    if (label && !colors.has(label)) {
      colors.set(label, { id: label, label });
    }
  }

  return [...colors.values()];
}

export function mergeColorOptions(
  product: CatalogProduct,
  variantColors: ProductColorOption[] = []
): ProductColorOption[] {
  const merged = new Map<string, ProductColorOption>();

  for (const option of parseProductColors(product)) {
    merged.set(option.id, option);
  }

  for (const option of variantColors) {
    if (!merged.has(option.id)) merged.set(option.id, option);
  }

  return [...merged.values()];
}
