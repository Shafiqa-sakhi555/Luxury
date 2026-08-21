import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { AuthorizationError, requirePermission } from "@/server/rbac";
import { writeAuditLog } from "@/server/audit";
import { slugify, uniqueProductSlug } from "@/lib/slug";
import type { AdminProductFormValues, MutationResult } from "@/types/admin-catalog";
import { getCategorySlugById } from "@/server/catalog/cloudinary-upload-context";
import { persistProductImages } from "@/server/catalog/product-image-sync";
import { deleteCloudinaryImage } from "@/lib/cloudinary";

function discountPercent(original: number, sale: number) {
  if (original <= 0 || sale >= original) return 0;
  return Math.round((1 - sale / original) * 100);
}

function normalizeColors(raw: string) {
  return raw
    .split(",")
    .map((color) => color.trim())
    .filter(Boolean)
    .join(", ");
}

function firstColor(raw: string) {
  const normalized = normalizeColors(raw);
  if (!normalized) return null;
  return normalized.split(", ")[0] ?? null;
}

async function upsertColorsSpecification(productId: string, colors: string) {
  const supabase = createSupabaseAdminClient();
  const normalized = normalizeColors(colors);

  if (!normalized) {
    await supabase
      .from("product_specifications")
      .delete()
      .eq("product_id", productId)
      .eq("spec_key", "colors");
    return;
  }

  await supabase.from("product_specifications").upsert(
    {
      product_id: productId,
      spec_key: "colors",
      spec_value: normalized,
      sort_order: 0,
    },
    { onConflict: "product_id,spec_key" }
  );
}

async function syncDefaultVariantPrices(productId: string, input: AdminProductFormValues) {
  const supabase = createSupabaseAdminClient();
  const prices = buildProductPrices(input);

  await supabase
    .from("product_variants")
    .update({
      original_price: prices.original_price,
      sale_price: prices.sale_price,
      discount_percentage: prices.discount_percentage,
      price_minor: prices.original_price_minor,
      sale_price_minor: prices.sale_price_minor,
    })
    .eq("product_id", productId)
    .eq("is_default", true);
}

async function updateDefaultVariantColor(productId: string, colors: string) {
  const supabase = createSupabaseAdminClient();
  const color = firstColor(colors);

  const { data: defaultVariant } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", productId)
    .eq("is_default", true)
    .maybeSingle();

  if (!defaultVariant) return;

  await supabase
    .from("product_variants")
    .update({ color })
    .eq("id", defaultVariant.id);
}

function buildProductPrices(input: AdminProductFormValues) {
  const originalMajor = input.originalPriceMajor;
  const saleMajor =
    input.salePriceMajor > 0 && input.salePriceMajor < originalMajor
      ? input.salePriceMajor
      : originalMajor;

  return {
    original_price: originalMajor,
    sale_price: saleMajor,
    discount_percentage: discountPercent(originalMajor, saleMajor),
    original_price_minor: Math.round(originalMajor * 100),
    sale_price_minor: Math.round(saleMajor * 100),
  };
}

async function createDefaultVariant(
  productId: string,
  input: AdminProductFormValues,
  sku: string
) {
  const supabase = createSupabaseAdminClient();
  const prices = buildProductPrices(input);
  const color = firstColor(input.colors);

  await supabase.from("product_variants").insert({
    product_id: productId,
    sku,
    name: input.name.trim(),
    color,
    original_price: prices.original_price,
    sale_price: prices.sale_price,
    discount_percentage: prices.discount_percentage,
    price_minor: prices.original_price_minor,
    sale_price_minor: prices.sale_price_minor,
    is_default: true,
    is_active: input.status === "ACTIVE",
  });
}

async function upsertSupabaseInventory(productId: string, stockQuantity: number) {
  const supabase = createSupabaseAdminClient();
  const stockStatus = stockQuantity > 0 ? "in_stock" : "out_of_stock";

  const { data: existing } = await supabase
    .from("inventory")
    .select("id")
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("inventory")
      .update({ stock_quantity: stockQuantity, stock_status: stockStatus })
      .eq("product_id", productId);
  } else {
    await supabase.from("inventory").insert({
      product_id: productId,
      stock_quantity: stockQuantity,
      stock_status: stockStatus,
    });
  }
}

export async function createSupabaseCatalogProduct(
  input: AdminProductFormValues
): Promise<MutationResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  try {
  const user = await requirePermission("product.write");
  const supabase = createSupabaseAdminClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, slug")
    .eq("id", input.categoryId)
    .maybeSingle();

  if (!category) return { ok: false, error: "Category not found." };

  const slug = await uniqueProductSlug(input.slug || input.name, async (candidate) => {
    const { data } = await supabase.from("products").select("id").eq("slug", candidate).maybeSingle();
    return Boolean(data);
  });

  const sku = input.sku.trim() || slug.toUpperCase().replace(/-/g, "_");
  const prices = buildProductPrices(input);

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      category_id: category.id,
      name: input.name.trim(),
      slug,
      short_description: input.shortDescription.trim() || null,
      description: input.description.trim() || null,
      ...prices,
      sku,
      selling_unit: input.sellingUnit.trim() || null,
      status: input.status,
      is_active: input.status === "ACTIVE",
      is_featured: input.isFeatured,
      has_variants: false,
    })
    .select("id")
    .single();

  if (error || !product) {
    return { ok: false, error: error?.message ?? "Failed to create product." };
  }

  await createDefaultVariant(product.id, input, sku);
  await upsertColorsSpecification(product.id, input.colors);

  const categorySlug = await getCategorySlugById(category.id);
  if (!categorySlug) {
    return { ok: false, error: "Category not found." };
  }

  const finalizedImages = await persistProductImages({
    productId: product.id,
    categorySlug,
    images: input.images,
    draftKey: input.draftKey,
    alt: input.name.trim(),
  });
  if (finalizedImages.length === 0 && input.images.some((image) => image.publicId || image.url)) {
    return { ok: false, error: "Product images could not be linked. Re-upload and save again." };
  }
  await upsertSupabaseInventory(product.id, input.stockQuantity);

  await writeAuditLog({
    actorId: user.id,
    action: "product.create",
    entityType: "SupabaseProduct",
    entityId: product.id,
    after: { name: input.name, slug },
  });

  revalidatePath("/admin/catalog/products");
  revalidatePath("/shop");

  return { ok: true, id: product.id };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: error instanceof Error ? error.message : "Failed to create product." };
  }
}

export async function updateSupabaseCatalogProduct(
  id: string,
  input: AdminProductFormValues
): Promise<MutationResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  try {
  const user = await requirePermission("product.write");
  const supabase = createSupabaseAdminClient();

  const { data: existing } = await supabase
    .from("products")
    .select("id, slug, has_variants, sku")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Product not found." };

  const { data: category } = await supabase
    .from("categories")
    .select("id, slug")
    .eq("id", input.categoryId)
    .maybeSingle();
  if (!category) return { ok: false, error: "Category not found." };

  const slug = await uniqueProductSlug(input.slug || input.name, async (candidate) => {
    const { data } = await supabase
      .from("products")
      .select("id")
      .eq("slug", candidate)
      .neq("id", id)
      .maybeSingle();
    return Boolean(data);
  }, existing.slug);

  const prices = buildProductPrices(input);

  const updatePayload: Record<string, unknown> = {
    category_id: category.id,
    name: input.name.trim(),
    slug,
    short_description: input.shortDescription.trim() || null,
    description: input.description.trim() || null,
    status: input.status,
    is_active: input.status === "ACTIVE",
    is_featured: input.isFeatured,
    selling_unit: input.sellingUnit.trim() || null,
  };

  if (!existing.has_variants) {
    Object.assign(updatePayload, prices);
    if (input.sku.trim()) updatePayload.sku = input.sku.trim();
  } else {
    Object.assign(updatePayload, prices);
  }

  const { error } = await supabase.from("products").update(updatePayload).eq("id", id);
  if (error) return { ok: false, error: error.message };

  const categorySlug = await getCategorySlugById(category.id);
  if (!categorySlug) {
    return { ok: false, error: "Category not found." };
  }

  const finalizedImages = await persistProductImages({
    productId: id,
    categorySlug,
    images: input.images,
    draftKey: input.draftKey,
    alt: input.name.trim(),
  });
  if (finalizedImages.length === 0 && input.images.some((image) => image.publicId || image.url)) {
    return { ok: false, error: "Product images could not be linked. Re-upload and save again." };
  }
  await upsertSupabaseInventory(id, input.stockQuantity);
  await upsertColorsSpecification(id, input.colors);

  if (!existing.has_variants) {
    await updateDefaultVariantColor(id, input.colors);
    await syncDefaultVariantPrices(id, input);
  }

  await writeAuditLog({
    actorId: user.id,
    action: "product.update",
    entityType: "SupabaseProduct",
    entityId: id,
    after: { name: input.name, slug, status: input.status },
  });

  revalidatePath("/admin/catalog/products");
  revalidatePath(`/admin/catalog/products/${id}`);
  revalidatePath("/shop");

  return { ok: true, id };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: error instanceof Error ? error.message : "Failed to update product." };
  }
}

export async function archiveSupabaseCatalogProduct(id: string): Promise<MutationResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  try {
  const user = await requirePermission("product.delete");
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("products").update({ status: "ARCHIVED" }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  await writeAuditLog({
    actorId: user.id,
    action: "product.archive",
    entityType: "SupabaseProduct",
    entityId: id,
  });

  revalidatePath("/admin/catalog/products");
  revalidatePath("/shop");

  return { ok: true, id };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: error instanceof Error ? error.message : "Failed to archive product." };
  }
}

export async function deleteSupabaseCatalogProduct(id: string): Promise<MutationResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  try {
    const user = await requirePermission("product.delete");
    const supabase = createSupabaseAdminClient();

    const { data: existing, error: loadError } = await supabase
      .from("products")
      .select("id, name, slug, product_images ( cloudinary_public_id )")
      .eq("id", id)
      .maybeSingle();

    if (loadError) return { ok: false, error: loadError.message };
    if (!existing) return { ok: false, error: "Product not found." };

    const imageRows = Array.isArray(existing.product_images)
      ? existing.product_images
      : existing.product_images
        ? [existing.product_images]
        : [];

    for (const image of imageRows) {
      if (image.cloudinary_public_id) {
        await deleteCloudinaryImage(image.cloudinary_public_id).catch(() => undefined);
      }
    }

    const { error: deleteError } = await supabase.from("products").delete().eq("id", id);
    if (deleteError) return { ok: false, error: deleteError.message };

    await writeAuditLog({
      actorId: user.id,
      action: "product.delete",
      entityType: "SupabaseProduct",
      entityId: id,
      before: { name: existing.name, slug: existing.slug },
    });

    revalidatePath("/admin/catalog/products");
    revalidatePath("/shop");

    return { ok: true, id };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: error instanceof Error ? error.message : "Failed to delete product." };
  }
}
