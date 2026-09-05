import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AdminProductFormValues } from "@/types/admin-catalog";
import type { AdminProductVariantInput } from "@/types/category-sizes";

function discountPercent(original: number, sale: number) {
  if (original <= 0 || sale >= original) return 0;
  return Math.round((1 - sale / original) * 100);
}

function buildVariantPrices(originalMajor: number, saleMajor: number) {
  const original = originalMajor;
  const sale = saleMajor > 0 && saleMajor < original ? saleMajor : original;
  return {
    original_price: original,
    sale_price: sale,
    discount_percentage: discountPercent(original, sale),
    price_minor: Math.round(original * 100),
    sale_price_minor: Math.round(sale * 100),
  };
}

function formatCustomSizeLabel(variant: AdminProductVariantInput): string {
  const customLabel = variant.attributes?.customLabel?.trim();
  if (customLabel) return customLabel;

  const width = variant.customWidth;
  const length = variant.customLength;
  const wUnit = variant.customWidthUnit ?? "ft";
  const lUnit = variant.customLengthUnit ?? "ft";
  if (width && length) return `${width} ${wUnit} × ${length} ${lUnit}`;
  if (width) return `${width} ${wUnit}`;
  if (length) return `${length} ${lUnit}`;
  return variant.sizeLabel || "Custom Size";
}

export function validateProductVariants(
  variants: AdminProductVariantInput[] | undefined
): string | null {
  if (!variants || variants.length === 0) return null;

  const skus = new Set<string>();
  for (const variant of variants) {
    const sku = variant.sku.trim();
    if (!sku) return "Each size variant must have a SKU.";
    if (skus.has(sku.toLowerCase())) return "SKUs must be unique across variants.";
    skus.add(sku.toLowerCase());

    if (variant.originalPriceMajor < 0) return "Price must be a positive number.";
    if (variant.salePriceMajor < 0) return "Sale price cannot be negative.";
    if (variant.salePriceMajor > variant.originalPriceMajor) {
      return "Sale price cannot exceed regular price.";
    }
    if (variant.stockQuantity < 0) return "Stock cannot be negative.";

    if (variant.isCustom) {
      const hasDimensions =
        variant.customWidth &&
        variant.customWidth > 0 &&
        variant.customLength &&
        variant.customLength > 0;
      const hasDetails =
        variant.attributes?.details?.trim() ||
        variant.dimensions?.trim() ||
        variant.attributes?.customLabel?.trim();

      if (!hasDimensions && !hasDetails) {
        return "Custom option requires dimensions or configuration details.";
      }
    }
  }

  return null;
}

export async function syncProductSizeVariants(
  productId: string,
  input: AdminProductFormValues,
  isActive: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const variants = input.variants;
  if (!variants || variants.length === 0) {
    return { ok: true };
  }

  const validationError = validateProductVariants(variants);
  if (validationError) return { ok: false, error: validationError };

  const supabase = createSupabaseAdminClient();
  const hasVariants = variants.length > 1;

  const { data: existingVariants, error: loadError } = await supabase
    .from("product_variants")
    .select("id, sku")
    .eq("product_id", productId);

  if (loadError) return { ok: false, error: loadError.message };

  const incomingIds = new Set(variants.filter((v) => v.id).map((v) => v.id!));
  const toRemove = (existingVariants ?? []).filter((row) => !incomingIds.has(row.id));

  for (const row of toRemove) {
    const [{ count: cartCount }, { count: orderCount }] = await Promise.all([
      supabase.from("cart_items").select("id", { count: "exact", head: true }).eq("variant_id", row.id),
      supabase.from("order_items").select("id", { count: "exact", head: true }).eq("variant_id", row.id),
    ]);

    if ((cartCount ?? 0) > 0 || (orderCount ?? 0) > 0) {
      return {
        ok: false,
        error: `Cannot remove variant ${row.sku} — it exists in carts or orders.`,
      };
    }
  }

  if (toRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from("product_variants")
      .delete()
      .in(
        "id",
        toRemove.map((row) => row.id)
      );
    if (deleteError) return { ok: false, error: deleteError.message };
  }

  const firstColor = input.colors
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)[0] ?? null;

  let minOriginalMinor = Number.MAX_SAFE_INTEGER;
  let minSaleMinor = Number.MAX_SAFE_INTEGER;

  for (let index = 0; index < variants.length; index++) {
    const variant = variants[index];
    const prices = buildVariantPrices(variant.originalPriceMajor, variant.salePriceMajor);
    minOriginalMinor = Math.min(minOriginalMinor, prices.price_minor);
    minSaleMinor = Math.min(minSaleMinor, prices.sale_price_minor);

    const sizeLabel = variant.isCustom ? formatCustomSizeLabel(variant) : variant.sizeLabel;
    const payload = {
      product_id: productId,
      sku: variant.sku.trim(),
      name: input.name.trim(),
      color: variant.color?.trim() || firstColor,
      design: input.design?.trim() || null,
      size: sizeLabel,
      category_size_id: variant.categorySizeId,
      custom_width: variant.isCustom ? variant.customWidth ?? null : null,
      custom_length: variant.isCustom ? variant.customLength ?? null : null,
      custom_width_unit: variant.isCustom ? variant.customWidthUnit ?? "ft" : null,
      custom_length_unit: variant.isCustom ? variant.customLengthUnit ?? "ft" : null,
      weight: variant.weight?.trim() || null,
      dimensions: variant.dimensions?.trim() || null,
      attributes: variant.attributes ?? {},
      ...prices,
      sort_order: index,
      is_default: variant.isDefault ?? index === 0,
      is_active: isActive,
    };

    let variantId = variant.id;

    if (variantId) {
      const { error } = await supabase.from("product_variants").update(payload).eq("id", variantId);
      if (error) return { ok: false, error: error.message };
    } else {
      const { data: created, error } = await supabase
        .from("product_variants")
        .insert(payload)
        .select("id")
        .single();
      if (error || !created) return { ok: false, error: error?.message ?? "Failed to create variant." };
      variantId = created.id;
    }

    const stockStatus = variant.stockQuantity > 0 ? "in_stock" : "out_of_stock";
    const { data: existingInventory } = await supabase
      .from("product_variant_inventory")
      .select("id")
      .eq("variant_id", variantId)
      .maybeSingle();

    if (existingInventory) {
      await supabase
        .from("product_variant_inventory")
        .update({ stock_quantity: variant.stockQuantity, stock_status: stockStatus })
        .eq("variant_id", variantId);
    } else {
      await supabase.from("product_variant_inventory").insert({
        variant_id: variantId,
        stock_quantity: variant.stockQuantity,
        stock_status: stockStatus,
      });
    }
  }

  const firstVariant = variants[0];
  const firstSizeLabel = firstVariant
    ? firstVariant.isCustom
      ? formatCustomSizeLabel(firstVariant)
      : firstVariant.sizeLabel
    : null;

  await supabase
    .from("products")
    .update({
      has_variants: hasVariants,
      original_price: minOriginalMinor === Number.MAX_SAFE_INTEGER ? 0 : minOriginalMinor / 100,
      sale_price: minSaleMinor === Number.MAX_SAFE_INTEGER ? 0 : minSaleMinor / 100,
      original_price_minor: minOriginalMinor === Number.MAX_SAFE_INTEGER ? 0 : minOriginalMinor,
      sale_price_minor: minSaleMinor === Number.MAX_SAFE_INTEGER ? 0 : minSaleMinor,
      fabric: input.fabric?.trim() || null,
      design: input.design?.trim() || null,
      size: firstSizeLabel,
    })
    .eq("id", productId);

  return { ok: true };
}

export async function checkSkuAvailability(
  skus: string[],
  excludeProductId?: string
): Promise<string | null> {
  if (skus.length === 0) return null;

  const supabase = createSupabaseAdminClient();
  const normalized = skus.map((sku) => sku.trim()).filter(Boolean);

  const { data: variantMatches } = await supabase
    .from("product_variants")
    .select("sku, product_id")
    .in("sku", normalized);

  for (const match of variantMatches ?? []) {
    if (excludeProductId && match.product_id === excludeProductId) continue;
    return `SKU "${match.sku}" is already in use.`;
  }

  const { data: productMatches } = await supabase
    .from("products")
    .select("sku, id")
    .in("sku", normalized);

  for (const match of productMatches ?? []) {
    if (excludeProductId && match.id === excludeProductId) continue;
    if (match.sku) return `SKU "${match.sku}" is already in use.`;
  }

  return null;
}
