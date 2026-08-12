import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { requirePermission } from "@/server/rbac";
import { writeAuditLog } from "@/server/audit";
import { slugify, uniqueProductSlug } from "@/lib/slug";
import { toMinor } from "@/lib/money";
import type { AdminProductFormValues } from "@/types/admin-catalog";
import { adminGetDefaultStoreId, parseImageUrlsFromText } from "@/server/catalog/admin-queries";

export type MutationResult = { ok: true; id: string } | { ok: false; error: string };

function publicationStatus(status: AdminProductFormValues["status"]) {
  return status;
}

async function syncProductMedia(productId: string, imageUrls: string[], alt: string) {
  await db.productMedia.deleteMany({ where: { productId } });
  if (imageUrls.length === 0) return;
  await db.productMedia.createMany({
    data: imageUrls.map((url, index) => ({
      productId,
      url,
      alt,
      sortOrder: index,
    })),
  });
}

async function syncVariantInventory(variantId: string, stockQuantity: number) {
  const storeId = await adminGetDefaultStoreId();
  if (!storeId) return;

  await db.inventoryBalance.upsert({
    where: { storeId_variantId: { storeId, variantId } },
    update: { onHand: stockQuantity },
    create: {
      storeId,
      variantId,
      onHand: stockQuantity,
      reorderPoint: 5,
    },
  });
}

export async function createPrismaProduct(
  input: AdminProductFormValues
): Promise<MutationResult> {
  const session = await requirePermission("product.write");

  const category = await db.category.findUnique({ where: { id: input.categoryId } });
  if (!category) return { ok: false, error: "Category not found." };

  const slug = await uniqueProductSlug(input.slug || input.name, async (candidate) => {
    const existing = await db.product.findUnique({ where: { slug: candidate } });
    return Boolean(existing);
  });

  const skuBase = input.sku.trim() || slugify(input.name).toUpperCase().replace(/-/g, "_");
  let sku = skuBase;
  let skuCounter = 2;
  while (await db.productVariant.findUnique({ where: { sku } })) {
    sku = `${skuBase}-${skuCounter}`;
    skuCounter += 1;
  }

  const imageUrls = parseImageUrlsFromText(input.imageUrls);
  const priceMinor = toMinor(input.originalPriceMajor);
  const salePriceMinor =
    input.salePriceMajor > 0 && input.salePriceMajor < input.originalPriceMajor
      ? toMinor(input.salePriceMajor)
      : null;

  const product = await db.product.create({
    data: {
      name: input.name.trim(),
      slug,
      shortDescription: input.shortDescription.trim() || null,
      description: input.description.trim() || null,
      categoryId: category.id,
      status: publicationStatus(input.status),
      isFeatured: input.isFeatured,
      productType: "SIMPLE",
      variants: {
        create: {
          sku,
          name: input.name.trim(),
          priceMinor,
          salePriceMinor,
          isActive: input.status === "ACTIVE",
        },
      },
    },
    include: { variants: true },
  });

  await syncProductMedia(product.id, imageUrls, product.name);
  const variant = product.variants[0];
  if (variant) {
    await syncVariantInventory(variant.id, input.stockQuantity);
  }

  await writeAuditLog({
    actorId: session.user.id,
    action: "product.create",
    entityType: "Product",
    entityId: product.id,
    after: { name: product.name, slug: product.slug },
  });

  revalidatePath("/admin/catalog/products");
  revalidatePath("/shop");

  return { ok: true, id: product.id };
}

export async function updatePrismaProduct(
  id: string,
  input: AdminProductFormValues
): Promise<MutationResult> {
  const session = await requirePermission("product.write");

  const existing = await db.product.findUnique({
    where: { id },
    include: { variants: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
  if (!existing) return { ok: false, error: "Product not found." };

  const category = await db.category.findUnique({ where: { id: input.categoryId } });
  if (!category) return { ok: false, error: "Category not found." };

  const slug = await uniqueProductSlug(input.slug || input.name, async (candidate) => {
    const found = await db.product.findFirst({
      where: { slug: candidate, NOT: { id } },
    });
    return Boolean(found);
  }, existing.slug);

  const imageUrls = parseImageUrlsFromText(input.imageUrls);
  const priceMinor = toMinor(input.originalPriceMajor);
  const salePriceMinor =
    input.salePriceMajor > 0 && input.salePriceMajor < input.originalPriceMajor
      ? toMinor(input.salePriceMajor)
      : null;

  const product = await db.product.update({
    where: { id },
    data: {
      name: input.name.trim(),
      slug,
      shortDescription: input.shortDescription.trim() || null,
      description: input.description.trim() || null,
      categoryId: category.id,
      status: publicationStatus(input.status),
      isFeatured: input.isFeatured,
    },
  });

  await syncProductMedia(product.id, imageUrls, product.name);

  const variant = existing.variants[0];
  if (variant) {
    await db.productVariant.update({
      where: { id: variant.id },
      data: {
        name: input.name.trim(),
        priceMinor,
        salePriceMinor,
        isActive: input.status === "ACTIVE",
      },
    });
    await syncVariantInventory(variant.id, input.stockQuantity);
  } else {
    const sku = input.sku.trim() || slugify(product.name).toUpperCase().replace(/-/g, "_");
    const created = await db.productVariant.create({
      data: {
        productId: product.id,
        sku,
        name: product.name,
        priceMinor,
        salePriceMinor,
        isActive: input.status === "ACTIVE",
      },
    });
    await syncVariantInventory(created.id, input.stockQuantity);
  }

  await writeAuditLog({
    actorId: session.user.id,
    action: "product.update",
    entityType: "Product",
    entityId: product.id,
    after: { name: product.name, slug: product.slug, status: product.status },
  });

  revalidatePath("/admin/catalog/products");
  revalidatePath(`/admin/catalog/products/${product.id}`);
  revalidatePath("/shop");

  return { ok: true, id: product.id };
}

export async function archivePrismaProduct(id: string): Promise<MutationResult> {
  const session = await requirePermission("product.delete");

  const product = await db.product.findUnique({ where: { id } });
  if (!product) return { ok: false, error: "Product not found." };

  await db.product.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });

  await db.productVariant.updateMany({
    where: { productId: id },
    data: { isActive: false },
  });

  await writeAuditLog({
    actorId: session.user.id,
    action: "product.archive",
    entityType: "Product",
    entityId: id,
    before: { status: product.status },
    after: { status: "ARCHIVED" },
  });

  revalidatePath("/admin/catalog/products");
  revalidatePath("/shop");

  return { ok: true, id };
}

export async function deletePrismaProduct(id: string): Promise<MutationResult> {
  const session = await requirePermission("product.delete");

  const product = await db.product.findUnique({
    where: { id },
    include: { _count: { select: { variants: true } } },
  });
  if (!product) return { ok: false, error: "Product not found." };

  const orderItems = await db.orderItem.count({
    where: { variant: { productId: id } },
  });
  if (orderItems > 0) {
    return archivePrismaProduct(id);
  }

  await db.product.delete({ where: { id } });

  await writeAuditLog({
    actorId: session.user.id,
    action: "product.delete",
    entityType: "Product",
    entityId: id,
    before: { name: product.name, slug: product.slug },
  });

  revalidatePath("/admin/catalog/products");
  revalidatePath("/shop");

  return { ok: true, id };
}
