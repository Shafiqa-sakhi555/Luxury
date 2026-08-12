import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requirePermission } from "@/server/rbac";
import { writeAuditLog } from "@/server/audit";
import { slugify, uniqueProductSlug } from "@/lib/slug";
import type { AdminProductFormValues } from "@/types/admin-catalog";
import { parseImageUrlsFromText } from "@/server/catalog/admin-queries";
import {
  syncPrismaCarpetCollection,
  syncPrismaVariantForSupabaseProduct,
} from "@/server/catalog/supabase-sync";
import type { MutationResult } from "@/server/catalog/admin-mutations";

function discountPercent(original: number, sale: number) {
  if (original <= 0 || sale >= original) return 0;
  return Math.round((1 - sale / original) * 100);
}

function unwrapRelation<T extends Record<string, unknown>>(
  value: T | T[] | null | undefined
): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

async function syncSupabaseProductToPrisma(productId: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      short_description,
      description,
      original_price,
      sale_price,
      sku,
      has_variants,
      categories ( slug ),
      product_images ( image_url, alt_text, sort_order, variant_id ),
      product_variants (
        id,
        sku,
        name,
        original_price,
        sale_price,
        is_active,
        product_images ( image_url, alt_text, sort_order )
      )
    `
    )
    .eq("id", productId)
    .maybeSingle();

  if (!data) return;

  const category = unwrapRelation(data.categories as { slug: string } | { slug: string }[] | null);
  if (!category?.slug) return;

  const collectionImages = (data.product_images ?? [])
    .filter((img) => !img.variant_id)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((img, index) => ({
      url: img.image_url,
      alt: img.alt_text,
      sortOrder: img.sort_order ?? index,
    }));

  const primaryImage = collectionImages[0]?.url ?? null;

  if (data.has_variants && (data.product_variants?.length ?? 0) > 0) {
    await syncPrismaCarpetCollection({
      supabaseProductId: data.id,
      name: data.name,
      slug: data.slug,
      shortDescription: data.short_description,
      description: data.description,
      categorySlug: category.slug,
      primaryImageUrl: primaryImage,
      variants: (data.product_variants ?? [])
        .filter((v) => v.is_active)
        .map((variant) => ({
          supabaseVariantId: variant.id,
          sku: variant.sku,
          name: variant.name ?? data.name,
          originalPriceMinor: Math.round(Number(variant.original_price) * 100),
          salePriceMinor: Math.round(Number(variant.sale_price) * 100),
          images:
            variant.product_images?.length > 0
              ? variant.product_images
                  .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                  .map((img, index) => ({
                    url: img.image_url,
                    alt: img.alt_text,
                    sortOrder: img.sort_order ?? index,
                  }))
              : collectionImages,
        })),
    });
    return;
  }

  const sku = data.sku ?? data.slug.toUpperCase().replace(/-/g, "_");
  await syncPrismaVariantForSupabaseProduct({
    supabaseId: data.id,
    name: data.name,
    slug: data.slug,
    sku,
    shortDescription: data.short_description,
    description: data.description,
    originalPriceMinor: Math.round(Number(data.original_price) * 100),
    salePriceMinor: Math.round(Number(data.sale_price) * 100),
    categorySlug: category.slug,
    primaryImageUrl: primaryImage,
    images: collectionImages,
  });
}

async function replaceSupabaseImages(productId: string, imageUrls: string[], alt: string) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("product_images").delete().eq("product_id", productId).is("variant_id", null);

  if (imageUrls.length === 0) return;

  await supabase.from("product_images").insert(
    imageUrls.map((url, index) => ({
      product_id: productId,
      image_url: url,
      alt_text: alt,
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

  const session = await requirePermission("product.write");
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
  const original = input.originalPriceMajor;
  const sale =
    input.salePriceMajor > 0 && input.salePriceMajor < original
      ? input.salePriceMajor
      : original;

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      category_id: category.id,
      name: input.name.trim(),
      slug,
      short_description: input.shortDescription.trim() || null,
      description: input.description.trim() || null,
      original_price: original,
      sale_price: sale,
      discount_percentage: discountPercent(original, sale),
      sku,
      selling_unit: input.sellingUnit.trim() || null,
      is_active: input.status === "ACTIVE",
      is_featured: input.isFeatured,
      has_variants: false,
    })
    .select("id")
    .single();

  if (error || !product) {
    return { ok: false, error: error?.message ?? "Failed to create product." };
  }

  const imageUrls = parseImageUrlsFromText(input.imageUrls);
  await replaceSupabaseImages(product.id, imageUrls, input.name.trim());
  await upsertSupabaseInventory(product.id, input.stockQuantity);
  await syncSupabaseProductToPrisma(product.id);

  await writeAuditLog({
    actorId: session.user.id,
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

  const session = await requirePermission("product.write");
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

  const original = input.originalPriceMajor;
  const sale =
    input.salePriceMajor > 0 && input.salePriceMajor < original
      ? input.salePriceMajor
      : original;

  const updatePayload: Record<string, unknown> = {
    category_id: category.id,
    name: input.name.trim(),
    slug,
    short_description: input.shortDescription.trim() || null,
    description: input.description.trim() || null,
    is_active: input.status === "ACTIVE",
    is_featured: input.isFeatured,
    selling_unit: input.sellingUnit.trim() || null,
  };

  if (!existing.has_variants) {
    updatePayload.original_price = original;
    updatePayload.sale_price = sale;
    updatePayload.discount_percentage = discountPercent(original, sale);
    if (input.sku.trim()) updatePayload.sku = input.sku.trim();
  } else {
    updatePayload.original_price = original;
    updatePayload.sale_price = sale;
    updatePayload.discount_percentage = discountPercent(original, sale);
  }

  const { error } = await supabase.from("products").update(updatePayload).eq("id", id);
  if (error) return { ok: false, error: error.message };

  const imageUrls = parseImageUrlsFromText(input.imageUrls);
  await replaceSupabaseImages(id, imageUrls, input.name.trim());
  await upsertSupabaseInventory(id, input.stockQuantity);
  await syncSupabaseProductToPrisma(id);

  await writeAuditLog({
    actorId: session.user.id,
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

  const session = await requirePermission("product.delete");
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("products").update({ is_active: false }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  await writeAuditLog({
    actorId: session.user.id,
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
