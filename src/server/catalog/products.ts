import { db } from "@/server/db";
import type { PublicationStatus, Prisma } from "@/generated/prisma/client";
import type { CatalogProduct, CatalogProductListResult } from "@/types/catalog";
import { effectivePriceMinor } from "@/lib/money";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SUPABASE_CATALOG_SLUGS, isSupabaseCatalogSlug, normalizeCategorySlug, isDeprecatedCategorySlug, formatCategoryLabel } from "@/lib/supabase/catalog-categories";
import {
  getSupabaseCategoryBySlug,
  getSupabaseProductBySlug,
  isSupabaseCategorySlug,
  listSupabaseProductsByCategorySlug,
} from "@/server/catalog/supabase-products";

export type ProductListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  categorySlug?: string;
  brandSlug?: string;
  status?: PublicationStatus;
  sort?: "newest" | "price_asc" | "price_desc" | "name";
};

const CURTAINS_SLUG = "curtains";

function prismaExcludesSupabaseCategories(where: Prisma.ProductWhereInput) {
  if (!isSupabaseConfigured()) return;
  const slugs = [...SUPABASE_CATALOG_SLUGS];
  where.NOT = {
    OR: slugs.map((slug) => ({ category: { slug } })),
  };
}

function mapPrismaProduct(
  product: Awaited<ReturnType<typeof fetchPrismaProducts>>["items"][number]
): CatalogProduct {
  const variant = product.variants[0];
  const priceMinor = variant?.priceMinor ?? 0;
  const salePriceMinor = variant
    ? effectivePriceMinor(variant.priceMinor, variant.salePriceMinor)
    : 0;
  const discount =
    variant?.salePriceMinor && variant.priceMinor > variant.salePriceMinor
      ? Math.round((1 - variant.salePriceMinor / variant.priceMinor) * 100)
      : 0;

  return {
    id: product.id,
    source: "prisma",
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    originalPriceMinor: priceMinor,
    salePriceMinor,
    discountPercentage: discount,
    currency: "PKR",
    sellingUnit: null,
    includedItems: null,
    size: null,
    fabric: null,
    design: null,
    sku: variant?.sku ?? null,
    isFeatured: product.isFeatured,
    category: {
      id: product.category.id ?? product.category.slug,
      name: product.category.name,
      slug: product.category.slug,
      description: null,
      imageUrl: null,
    },
    images: product.media.map((m) => ({
      id: m.id,
      url: m.url,
      alt: m.alt,
      sortOrder: m.sortOrder,
      isPrimary: m.sortOrder === 0,
    })),
    specifications: [],
    stockQuantity: null,
    stockStatus: null,
    variantId: variant?.id ?? null,
    brand: product.brand,
  };
}

async function fetchPrismaProducts(params: ProductListParams) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 24));
  const skip = (page - 1) * pageSize;

  const where: Prisma.ProductWhereInput = {};

  if (params.status) {
    where.status = params.status;
  } else {
    where.status = "ACTIVE";
  }

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { slug: { contains: params.search, mode: "insensitive" } },
      { variants: { some: { sku: { contains: params.search, mode: "insensitive" } } } },
    ];
  }

  if (params.categorySlug) {
    where.category = { slug: params.categorySlug };
  }

  if (params.brandSlug) {
    where.brand = { slug: params.brandSlug };
  }

  // Exclude Supabase-owned categories when merging the full Prisma catalog
  if (isSupabaseConfigured() && !params.categorySlug) {
    prismaExcludesSupabaseCategories(where);
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (params.sort === "name") orderBy = { name: "asc" };
  if (params.sort === "newest") orderBy = { createdAt: "desc" };

  const [items, total] = await Promise.all([
    db.product.findMany({
      where,
      skip,
      take: pageSize,
      orderBy,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { name: true, slug: true } },
        media: { orderBy: { sortOrder: "asc" } },
        variants: {
          where: { isActive: true },
          orderBy: { priceMinor: "asc" },
          take: 1,
        },
        _count: { select: { variants: true, reviews: true } },
      },
    }),
    db.product.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function listProducts(
  params: ProductListParams = {}
): Promise<CatalogProductListResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 24));
  const categorySlug = normalizeCategorySlug(params.categorySlug);

  // Supabase-owned category
  if (isSupabaseConfigured() && categorySlug && isSupabaseCatalogSlug(categorySlug)) {
    const supabaseResult = await listSupabaseProductsByCategorySlug(categorySlug, {
      page,
      pageSize,
      search: params.search,
    });
    if (supabaseResult && supabaseResult.total > 0) return supabaseResult;

    // Fallback: Prisma-synced products when Supabase is empty or unreachable
    const prismaResult = await fetchPrismaProducts({ ...params, categorySlug });
    if (prismaResult.total > 0) {
      return {
        items: prismaResult.items.map(mapPrismaProduct),
        total: prismaResult.total,
        page: prismaResult.page,
        pageSize: prismaResult.pageSize,
        totalPages: prismaResult.totalPages,
      };
    }

    if (supabaseResult) return supabaseResult;
  }

  // All products — merge Supabase catalog with Prisma catalog
  if (isSupabaseConfigured() && !params.categorySlug) {
    const supabaseLists = await Promise.all(
      SUPABASE_CATALOG_SLUGS.map((slug) =>
        listSupabaseProductsByCategorySlug(slug, { page: 1, pageSize: 200 })
      )
    );
    const supabaseItems = supabaseLists.flatMap((result) => result?.items ?? []);
    const prismaResult = await fetchPrismaProducts(params);
    const prismaItems = prismaResult.items.map(mapPrismaProduct);
    const merged = [...supabaseItems, ...prismaItems];

    if (params.sort === "name") merged.sort((a, b) => a.name.localeCompare(b.name));
    if (params.sort === "price_asc")
      merged.sort((a, b) => a.salePriceMinor - b.salePriceMinor);
    if (params.sort === "price_desc")
      merged.sort((a, b) => b.salePriceMinor - a.salePriceMinor);

    const total = merged.length;
    const start = (page - 1) * pageSize;
    const items = merged.slice(start, start + pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  const prismaResult = await fetchPrismaProducts(params);
  return {
    items: prismaResult.items.map(mapPrismaProduct),
    total: prismaResult.total,
    page: prismaResult.page,
    pageSize: prismaResult.pageSize,
    totalPages: prismaResult.totalPages,
  };
}

export async function getProductBySlug(
  slug: string,
  admin = false
): Promise<CatalogProduct | null> {
  if (!admin && isSupabaseConfigured()) {
    const supabaseProduct = await getSupabaseProductBySlug(slug);
    if (supabaseProduct) return supabaseProduct;
  }

  const product = await db.product.findFirst({
    where: {
      slug,
      ...(admin ? {} : { status: "ACTIVE" }),
    },
    include: {
      category: true,
      brand: { select: { name: true, slug: true } },
      media: { orderBy: { sortOrder: "asc" } },
      variants: {
        where: admin ? undefined : { isActive: true },
        orderBy: { priceMinor: "asc" },
        take: 1,
      },
    },
  });

  if (!product) return null;

  const mapped = mapPrismaProduct({
    ...product,
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    },
    brand: product.brand,
    _count: { variants: 1, reviews: 0 },
  });

  return { ...mapped, variantId: product.variants[0]?.id ?? null };
}

export async function getRelatedProducts(slug: string, categorySlug: string) {
  const result = await listProducts({ categorySlug, pageSize: 4 });
  return result.items.filter((p) => p.slug !== slug).slice(0, 4);
}

export async function listShopFilterCategories() {
  const seen = new Set<string>();
  const items: Array<{ label: string; href: string; slug: string }> = [];

  const add = (slug: string, label: string) => {
    const canonical = normalizeCategorySlug(slug) ?? slug;
    if (isDeprecatedCategorySlug(slug) || seen.has(canonical)) return;
    seen.add(canonical);
    items.push({
      label,
      href: `/shop?category=${canonical}`,
      slug: canonical,
    });
  };

  if (isSupabaseConfigured()) {
    for (const slug of SUPABASE_CATALOG_SLUGS) {
      const category = await getSupabaseCategoryBySlug(slug);
      add(slug, category?.name ?? formatCategoryLabel(slug));
    }
  }

  const prismaCategories = await db.category.findMany({
    where: { status: "ACTIVE", parentId: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { name: true, slug: true },
  });

  for (const category of prismaCategories) {
    const canonical = normalizeCategorySlug(category.slug) ?? category.slug;
    if (isDeprecatedCategorySlug(category.slug)) continue;
    if ((SUPABASE_CATALOG_SLUGS as readonly string[]).includes(canonical)) continue;
    add(category.slug, category.name);
  }

  return items;
}

export async function listCategories(includeDraft = false) {
  return db.category.findMany({
    where: includeDraft ? undefined : { status: "ACTIVE" },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      children: { orderBy: { sortOrder: "asc" } },
      _count: { select: { products: true } },
    },
  });
}

export async function getCategoryBySlug(slug: string) {
  const normalized = normalizeCategorySlug(slug) ?? slug;
  if (isSupabaseConfigured() && (await isSupabaseCategorySlug(normalized))) {
    const category = await getSupabaseCategoryBySlug(normalized);
    if (category) {
      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        heroImage: category.imageUrl,
        parentId: null,
        sortOrder: 0,
        status: "ACTIVE" as const,
        seoTitle: null,
        seoDescription: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        children: [],
        attributes: [],
      };
    }
  }

  return db.category.findFirst({
    where: { slug: normalized, status: "ACTIVE" },
    include: {
      children: { where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } },
      attributes: { orderBy: { displayOrder: "asc" }, include: { options: true } },
    },
  });
}

export async function listBrands() {
  return db.brand.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
  });
}

export async function adminListProducts(params: ProductListParams = {}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));
  const skip = (page - 1) * pageSize;

  const where: Prisma.ProductWhereInput = {};

  if (params.status) where.status = params.status;
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { variants: { some: { sku: { contains: params.search, mode: "insensitive" } } } },
    ];
  }
  if (params.categorySlug) where.category = { slug: params.categorySlug };
  if (params.brandSlug) where.brand = { slug: params.brandSlug };

  const [items, total] = await Promise.all([
    db.product.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { updatedAt: "desc" },
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        media: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: { select: { id: true, sku: true, priceMinor: true, salePriceMinor: true } },
        _count: { select: { variants: true } },
      },
    }),
    db.product.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
