import { resolveProductShipping } from "@/lib/shipping/calculate";
import type { ShippingCartItem } from "@/lib/shipping/types";

function unwrap<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function parseVariantWeight(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw !== "string") return null;
  const match = raw.replace(",", ".").match(/[\d.]+/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function cartToShippingItems(
  cart: {
    cart_items?: Array<{
      quantity: number;
      customization?: Record<string, unknown> | null;
      product_variants?: {
        weight?: string | number | null;
        products?: {
          id?: string;
          name?: string | null;
          shipping_type?: string | null;
          shipping_weight_kg?: number | string | null;
          furniture_kind?: string | null;
          categories?: {
            slug?: string | null;
            name?: string | null;
          } | Array<{ slug?: string | null; name?: string | null }> | null;
        } | Array<Record<string, unknown>> | null;
      } | null;
    }> | null;
  } | null
): ShippingCartItem[] {
  if (!cart?.cart_items?.length) return [];

  return cart.cart_items.map((item) => {
    const product = unwrap(item.product_variants?.products) as {
      id?: string;
      name?: string | null;
      shipping_type?: string | null;
      shipping_weight_kg?: number | string | null;
      furniture_kind?: string | null;
      categories?: {
        slug?: string | null;
        name?: string | null;
      } | Array<{ slug?: string | null; name?: string | null }> | null;
    } | null;
    const category = unwrap(product?.categories);
    const variantWeight = parseVariantWeight(item.product_variants?.weight);
    const productWeight = Number(product?.shipping_weight_kg);
    const resolved = resolveProductShipping({
      shippingType: product?.shipping_type,
      shippingWeightKg:
        Number.isFinite(productWeight) && productWeight > 0 ? productWeight : variantWeight,
      furnitureKind: product?.furniture_kind,
      categorySlug: category?.slug,
      categoryName: category?.name,
      productName: product?.name,
    });

    return {
      productId: product?.id,
      name: product?.name ?? undefined,
      quantity: item.quantity,
      shippingType: resolved.type,
      weightKg: resolved.weightKg,
      furnitureKind: resolved.furnitureKind,
    };
  });
}
