export type OrderLineVariantInfo = {
  color: string | null;
  size: string | null;
  label: string | null;
};

function clean(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function variantDisplayFromCart(variant?: {
  color?: string | null;
  size?: string | null;
  name?: string | null;
} | null): OrderLineVariantInfo {
  const color = clean(variant?.color);
  const size = clean(variant?.size);
  const parts = [color, size].filter(Boolean) as string[];
  return {
    color,
    size,
    label: parts.join(" · ") || clean(variant?.name),
  };
}

export function variantDisplayFromOrderItem(item: {
  variant_name?: string | null;
  customization?: { color?: string | null; size?: string | null } | null;
  product_variants?:
    | { color?: string | null; size?: string | null; name?: string | null }
    | Array<{ color?: string | null; size?: string | null; name?: string | null }>
    | null;
}): OrderLineVariantInfo {
  const variant = Array.isArray(item.product_variants) ? item.product_variants[0] : item.product_variants;
  const custom = item.customization && typeof item.customization === "object" ? item.customization : null;
  const color = clean(custom?.color) || clean(variant?.color);
  const size = clean(custom?.size) || clean(variant?.size);
  const parts = [color, size].filter(Boolean) as string[];
  return {
    color,
    size,
    label: parts.join(" · ") || clean(item.variant_name) || clean(variant?.name),
  };
}
