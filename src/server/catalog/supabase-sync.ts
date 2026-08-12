import { db } from "@/server/db";

type SyncInput = {
  supabaseId: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  description: string | null;
  originalPriceMinor: number;
  salePriceMinor: number;
  categorySlug: string;
  primaryImageUrl: string | null;
  images: Array<{ url: string; alt: string | null; sortOrder: number }>;
};

/**
 * Keeps a Prisma ProductVariant in sync for Supabase catalog items so the
 * existing cart/checkout flow continues to work. Supabase remains the catalog
 * source of truth; Prisma stores the operational variant keyed by externalCisId.
 */
export async function syncPrismaVariantForSupabaseProduct(input: SyncInput) {
  let category = await db.category.findUnique({
    where: { slug: input.categorySlug },
  });

  if (!category) {
    category = await db.category.create({
      data: {
        name: input.categorySlug
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        slug: input.categorySlug,
        status: "ACTIVE",
      },
    });
  }

  const product = await db.product.upsert({
    where: { slug: input.slug },
    update: {
      name: input.name,
      shortDescription: input.shortDescription,
      description: input.description,
      categoryId: category.id,
      status: "ACTIVE",
      externalCisId: input.supabaseId,
    },
    create: {
      name: input.name,
      slug: input.slug,
      shortDescription: input.shortDescription,
      description: input.description,
      categoryId: category.id,
      status: "ACTIVE",
      externalCisId: input.supabaseId,
      productType: "SIMPLE",
    },
  });

  await db.productMedia.deleteMany({ where: { productId: product.id } });
  if (input.images.length > 0) {
    await db.productMedia.createMany({
      data: input.images.map((img, index) => ({
        productId: product.id,
        url: img.url,
        alt: img.alt ?? input.name,
        sortOrder: img.sortOrder ?? index,
      })),
    });
  } else if (input.primaryImageUrl) {
    await db.productMedia.create({
      data: {
        productId: product.id,
        url: input.primaryImageUrl,
        alt: input.name,
        sortOrder: 0,
      },
    });
  }

  const variant = await db.productVariant.upsert({
    where: { sku: input.sku },
    update: {
      productId: product.id,
      name: input.name,
      priceMinor: input.originalPriceMinor,
      salePriceMinor: input.salePriceMinor,
      isActive: true,
    },
    create: {
      productId: product.id,
      sku: input.sku,
      name: input.name,
      priceMinor: input.originalPriceMinor,
      salePriceMinor: input.salePriceMinor,
      isActive: true,
    },
  });

  return variant;
}

type CarpetVariantSyncInput = {
  supabaseVariantId: string;
  sku: string;
  name: string;
  originalPriceMinor: number;
  salePriceMinor: number;
  images: Array<{ url: string; alt: string | null; sortOrder: number }>;
};

type CarpetCollectionSyncInput = {
  supabaseProductId: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  categorySlug: string;
  primaryImageUrl: string | null;
  variants: CarpetVariantSyncInput[];
};

export async function syncPrismaCarpetCollection(input: CarpetCollectionSyncInput) {
  let category = await db.category.findUnique({
    where: { slug: input.categorySlug },
  });

  if (!category) {
    category = await db.category.create({
      data: {
        name: input.categorySlug
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        slug: input.categorySlug,
        status: "ACTIVE",
      },
    });
  }

  const product = await db.product.upsert({
    where: { slug: input.slug },
    update: {
      name: input.name,
      shortDescription: input.shortDescription,
      description: input.description,
      categoryId: category.id,
      status: "ACTIVE",
      externalCisId: input.supabaseProductId,
      productType: "VARIANT",
    },
    create: {
      name: input.name,
      slug: input.slug,
      shortDescription: input.shortDescription,
      description: input.description,
      categoryId: category.id,
      status: "ACTIVE",
      externalCisId: input.supabaseProductId,
      productType: "VARIANT",
    },
  });

  const gallery = input.variants[0]?.images.length
    ? input.variants[0].images
    : input.primaryImageUrl
      ? [{ url: input.primaryImageUrl, alt: input.name, sortOrder: 0 }]
      : [];

  await db.productMedia.deleteMany({ where: { productId: product.id } });
  if (gallery.length > 0) {
    await db.productMedia.createMany({
      data: gallery.map((img, index) => ({
        productId: product.id,
        url: img.url,
        alt: img.alt ?? input.name,
        sortOrder: img.sortOrder ?? index,
      })),
    });
  }

  const syncedVariants = [];
  for (const variant of input.variants) {
    const row = await db.productVariant.upsert({
      where: { sku: variant.sku },
      update: {
        productId: product.id,
        name: variant.name,
        priceMinor: variant.originalPriceMinor,
        salePriceMinor: variant.salePriceMinor,
        externalCisVariantId: variant.supabaseVariantId,
        isActive: true,
      },
      create: {
        productId: product.id,
        sku: variant.sku,
        name: variant.name,
        priceMinor: variant.originalPriceMinor,
        salePriceMinor: variant.salePriceMinor,
        externalCisVariantId: variant.supabaseVariantId,
        isActive: true,
      },
    });
    syncedVariants.push(row);
  }

  return { product, variants: syncedVariants };
}

export async function syncPrismaVariantForSupabaseVariant(input: SyncInput) {
  return syncPrismaVariantForSupabaseProduct(input);
}

export async function getSupabaseSlugByPrismaProductId(productId: string) {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { externalCisId: true, slug: true },
  });
  return product?.externalCisId ? product.slug : null;
}
