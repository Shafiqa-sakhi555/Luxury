import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requirePermission } from "@/server/rbac";
import { writeAuditLog } from "@/server/audit";
import { slugify, uniqueProductSlug } from "@/lib/slug";
import type { AdminProductFormValues, MutationResult } from "@/types/admin-catalog";
import type { AdminProductImage } from "@/types/media";
import { deleteCloudinaryImage } from "@/lib/cloudinary";

function discountPercent(original: number, sale: number) {
  if (original <= 0 || sale >= original) return 0;
  return Math.round((1 - sale / original) * 100);
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

  await supabase.from("product_variants").insert({
    product_id: productId,
    sku,
    name: input.name.trim(),
    original_price: prices.original_price,
    sale_price: prices.sale_price,
    discount_percentage: prices.discount_percentage,
    price_minor: prices.original_price_minor,
    sale_price_minor: prices.sale_price_minor,
    is_default: true,
    is_active: input.status === "ACTIVE",
  });
}

async function syncProductImages(
  productId: string,
  images: AdminProductImage[],
  alt: string
) {
  const supabase = createSupabaseAdminClient();

  const { data: existing } = await supabase
    .from("product_images")
    .select("cloudinary_public_id")
    .eq("product_id", productId)
    .is("variant_id", null);

  const nextPublicIds = new Set(images.map((image) => image.publicId).filter(Boolean));
  const removedPublicIds = (existing ?? [])
    .map((row) => row.cloudinary_public_id)
    .filter((publicId): publicId is string => Boolean(publicId && !nextPublicIds.has(publicId)));

  for (const publicId of removedPublicIds) {
    await deleteCloudinaryImage(publicId).catch(() => undefined);
  }

  await supabase.from("product_images").delete().eq("product_id", productId).is("variant_id", null);

  if (images.length === 0) return;

  await supabase.from("product_images").insert(
    images.map((image, index) => ({
      product_id: productId,
      image_url: image.url,
      cloudinary_public_id: image.publicId || null,
      alt_text: image.alt ?? alt,
      sort_order: index,
      is_primary: index === 0,
    }))
  );
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
  await syncProductImages(product.id, input.images, input.name.trim());
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
}

export async function updateSupabaseCatalogProduct(
  id: string,
  input: AdminProductFormValues
): Promise<MutationResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

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
    .select("id")
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

  await syncProductImages(id, input.images, input.name.trim());
  await upsertSupabaseInventory(id, input.stockQuantity);

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
}

export async function archiveSupabaseCatalogProduct(id: string): Promise<MutationResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

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
}

export async function deleteSupabaseCatalogProduct(id: string): Promise<MutationResult> {
  return archiveSupabaseCatalogProduct(id);
}
