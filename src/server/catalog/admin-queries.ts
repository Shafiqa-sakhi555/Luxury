import { db } from "@/server/db";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SUPABASE_CATALOG_SLUGS } from "@/lib/supabase/catalog-categories";
import { effectivePriceMinor, toMinor } from "@/lib/money";
import type {
  AdminCategoryOption,
  AdminProductDetail,
  AdminProductListItem,
  CatalogSource,
} from "@/types/admin-catalog";

function parseImageUrls(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseImageUrlsFromText(raw: string) {
  return parseImageUrls(raw);
}

export function imageUrlsToText(urls: string[]) {
  return urls.join("\n");
}

function unwrapRelation<T extends Record<string, unknown>>(
  value: T | T[] | null | undefined
): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

async function adminListSupabaseProducts(): Promise<AdminProductListItem[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      original_price,
      sale_price,
      has_variants,
      is_active,
      is_featured,
      updated_at,
      categories ( name, slug ),
      product_images ( image_url, sort_order, is_primary )
    `
    )
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const category = unwrapRelation(row.categories as { name: string; slug: string } | { name: string; slug: string }[] | null);
    const images = [...(row.product_images ?? [])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
    const primary = images.find((img) => img.is_primary) ?? images[0];
    const originalMinor = toMinor(Number(row.original_price));
    const saleMinor = toMinor(Number(row.sale_price));

    return {
      id: row.id,
      source: "supabase" as const,
      name: row.name,
      slug: row.slug,
      categoryName: category?.name ?? "—",
      categorySlug: category?.slug ?? "",
      skuCount: row.has_variants ? 2 : 1,
      priceFromMinor: effectivePriceMinor(originalMinor, saleMinor),
      status: row.is_active ? "ACTIVE" : "ARCHIVED",
      isFeatured: row.is_featured,
      imageUrl: primary?.image_url ?? null,
      updatedAt: row.updated_at,
      hasVariants: row.has_variants,
    };
  });
}

export async function adminGetCatalogProductCounts() {
  const prismaBaseWhere = {
    NOT: { category: { slug: { in: [...SUPABASE_CATALOG_SLUGS] } } },
  };

  const [prismaPublished, prismaDraft, prismaArchived] = await Promise.all([
    db.product.count({ where: { ...prismaBaseWhere, status: "ACTIVE" } }),
    db.product.count({ where: { ...prismaBaseWhere, status: "DRAFT" } }),
    db.product.count({ where: { ...prismaBaseWhere, status: "ARCHIVED" } }),
  ]);

  let supabasePublished = 0;
  let supabaseArchived = 0;

  if (isSupabaseConfigured()) {
    const supabase = createSupabaseAdminClient();
    const [{ count: activeCount }, { count: inactiveCount }] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", false),
    ]);
    supabasePublished = activeCount ?? 0;
    supabaseArchived = inactiveCount ?? 0;
  }

  const published = prismaPublished + supabasePublished;
  const draft = prismaDraft;
  const archived = prismaArchived + supabaseArchived;

  return {
    published,
    draft,
    archived,
    total: published + draft + archived,
  };
}

export async function adminListAllProducts(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: "ACTIVE" | "DRAFT" | "ARCHIVED";
  categorySlug?: string;
  source?: CatalogSource | "all";
}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));

  const [supabaseItems, prismaItems] = await Promise.all([
    params.source === "prisma" ? Promise.resolve([]) : adminListSupabaseProducts(),
    params.source === "supabase"
      ? Promise.resolve([])
      : db.product.findMany({
          where: {
            NOT: { category: { slug: { in: [...SUPABASE_CATALOG_SLUGS] } } },
          },
          orderBy: { updatedAt: "desc" },
          include: {
            category: { select: { name: true, slug: true } },
            media: { orderBy: { sortOrder: "asc" }, take: 1 },
            variants: {
              select: { id: true, priceMinor: true, salePriceMinor: true },
              orderBy: { priceMinor: "asc" },
              take: 1,
            },
            _count: { select: { variants: true } },
          },
        }),
  ]);

  const prismaMapped: AdminProductListItem[] = prismaItems.map((product) => {
    const variant = product.variants[0];
    const price = variant
      ? effectivePriceMinor(variant.priceMinor, variant.salePriceMinor)
      : 0;
    return {
      id: product.id,
      source: "prisma" as const,
      name: product.name,
      slug: product.slug,
      categoryName: product.category.name,
      categorySlug: product.category.slug,
      skuCount: product._count.variants,
      priceFromMinor: price,
      status: product.status,
      isFeatured: product.isFeatured,
      imageUrl: product.media[0]?.url ?? null,
      updatedAt: product.updatedAt.toISOString(),
      hasVariants: product._count.variants > 1,
    };
  });

  let merged = [...supabaseItems, ...prismaMapped];

  if (params.search) {
    const q = params.search.toLowerCase();
    merged = merged.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        item.categoryName.toLowerCase().includes(q)
    );
  }

  if (params.status) {
    merged = merged.filter((item) => item.status === params.status);
  }

  if (params.categorySlug) {
    merged = merged.filter((item) => item.categorySlug === params.categorySlug);
  }

  merged.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const total = merged.length;
  const start = (page - 1) * pageSize;
  const items = merged.slice(start, start + pageSize);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function adminListCategoryOptions(): Promise<AdminCategoryOption[]> {
  const prismaCategories = await db.category.findMany({
    where: {
      status: "ACTIVE",
      slug: { notIn: [...SUPABASE_CATALOG_SLUGS] },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true },
  });

  const options: AdminCategoryOption[] = prismaCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    source: "prisma",
  }));

  if (isSupabaseConfigured()) {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("name");

    for (const cat of data ?? []) {
      options.push({
        id: cat.id,
        name: `${cat.name} (Supabase)`,
        slug: cat.slug,
        source: "supabase",
      });
    }
  }

  return options;
}

export async function adminGetProduct(
  id: string,
  source: CatalogSource
): Promise<AdminProductDetail | null> {
  if (source === "supabase") {
    if (!isSupabaseConfigured()) return null;
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("products")
      .select(
        `
        id,
        category_id,
        name,
        slug,
        short_description,
        description,
        original_price,
        sale_price,
        sku,
        selling_unit,
        has_variants,
        is_active,
        is_featured,
        categories ( name, slug ),
        product_images ( image_url, sort_order ),
        inventory ( stock_quantity )
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (!data) return null;

    const category = unwrapRelation(data.categories as { name: string; slug: string } | { name: string; slug: string }[] | null);
    const images = [...(data.product_images ?? [])]
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((img) => img.image_url);

    return {
      id: data.id,
      source: "supabase",
      categoryId: data.category_id,
      categoryName: category?.name ?? "",
      categorySlug: category?.slug ?? "",
      name: data.name,
      slug: data.slug,
      shortDescription: data.short_description ?? "",
      description: data.description ?? "",
      sku: data.sku ?? "",
      originalPriceMajor: Number(data.original_price),
      salePriceMajor: Number(data.sale_price),
      stockQuantity: data.inventory?.[0]?.stock_quantity ?? 0,
      status: data.is_active ? "ACTIVE" : "ARCHIVED",
      isFeatured: data.is_featured,
      sellingUnit: data.selling_unit ?? "",
      imageUrls: imageUrlsToText(images),
      hasVariants: data.has_variants,
    };
  }

  const product = await db.product.findUnique({
    where: { id },
    include: {
      category: { select: { name: true, slug: true } },
      media: { orderBy: { sortOrder: "asc" } },
      variants: {
        orderBy: { createdAt: "asc" },
        include: {
          inventoryBalances: { take: 1 },
        },
      },
    },
  });

  if (!product) return null;

  const variant = product.variants[0];
  const images = product.media.map((m) => m.url);

  return {
    id: product.id,
    source: "prisma",
    categoryId: product.categoryId,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    sku: variant?.sku ?? "",
    originalPriceMajor: variant ? variant.priceMinor / 100 : 0,
    salePriceMajor: variant?.salePriceMinor ? variant.salePriceMinor / 100 : 0,
    stockQuantity: variant?.inventoryBalances[0]?.onHand ?? 0,
    status: product.status,
    isFeatured: product.isFeatured,
    sellingUnit: "",
    imageUrls: imageUrlsToText(images),
    hasVariants: product.variants.length > 1,
  };
}

export async function adminGetDefaultStoreId() {
  const store = await db.store.findFirst({ orderBy: { createdAt: "asc" } });
  return store?.id ?? null;
}
