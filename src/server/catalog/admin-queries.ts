import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
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

async function adminListSupabaseProducts(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: "ACTIVE" | "DRAFT" | "ARCHIVED";
  categorySlug?: string;
}): Promise<{ items: AdminProductListItem[], total: number }> {
  if (!isSupabaseConfigured()) return { items: [], total: 0 };

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      original_price_minor,
      sale_price_minor,
      has_variants,
      status,
      is_featured,
      updated_at,
      categories!inner ( name, slug ),
      product_images ( image_url, sort_order, is_primary )
    `, { count: 'exact' }
    );

  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,slug.ilike.%${params.search}%`);
  }
  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.categorySlug) {
    query = query.eq('categories.slug', params.categorySlug);
  }

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  const { data, count, error } = await query
    .order("updated_at", { ascending: false })
    .range(start, end);

  if (error || !data) return { items: [], total: 0 };

  const items = data.map((row) => {
    const category = unwrapRelation(row.categories as any);
    const images = [...(row.product_images ?? [])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
    const primary = images.find((img) => img.is_primary) ?? images[0];

    return {
      id: row.id,
      source: "supabase" as const,
      name: row.name,
      slug: row.slug,
      categoryName: category?.name ?? "—",
      categorySlug: category?.slug ?? "",
      skuCount: row.has_variants ? 2 : 1, // Simplified for now
      priceFromMinor: effectivePriceMinor(row.original_price_minor, row.sale_price_minor),
      status: row.status as any,
      isFeatured: row.is_featured,
      imageUrl: primary?.image_url ?? null,
      updatedAt: row.updated_at,
      hasVariants: row.has_variants,
    };
  });

  return { items, total: count ?? 0 };
}

export async function adminGetCatalogProductCounts() {
  if (!isSupabaseConfigured()) {
    return { published: 0, draft: 0, archived: 0, total: 0 };
  }

  const supabase = createSupabaseAdminClient();
  const [{ count: activeCount }, { count: draftCount }, { count: archivedCount }] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "ACTIVE"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "DRAFT"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "ARCHIVED"),
  ]);

  const published = activeCount ?? 0;
  const draft = draftCount ?? 0;
  const archived = archivedCount ?? 0;

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

  const result = await adminListSupabaseProducts(params);

  return { 
    items: result.items, 
    total: result.total, 
    page, 
    pageSize, 
    totalPages: Math.ceil(result.total / pageSize) 
  };
}

export async function adminListCategoryOptions(): Promise<AdminCategoryOption[]> {
  const options: AdminCategoryOption[] = [];

  if (isSupabaseConfigured()) {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug")
      .order("name");

    for (const cat of data ?? []) {
      options.push({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
      });
    }
  }

  return options;
}

export async function adminGetProduct(
  id: string,
  source: CatalogSource
): Promise<AdminProductDetail | null> {
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
      original_price_minor,
      sale_price_minor,
      sku,
      selling_unit,
      has_variants,
      status,
      is_featured,
      categories ( name, slug ),
      product_images ( image_url, sort_order ),
      inventory ( stock_quantity )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;

  const category = unwrapRelation(data.categories as any);
  const inventory = unwrapRelation(data.inventory as any);
  const images = [...(data.product_images ?? [])]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((img) => img.image_url);

  return {
    id: data.id,
    categoryId: data.category_id,
    categoryName: category?.name ?? "",
    categorySlug: category?.slug ?? "",
    name: data.name,
    slug: data.slug,
    shortDescription: data.short_description ?? "",
    description: data.description ?? "",
    sku: data.sku ?? "",
    originalPriceMajor: Number(data.original_price ?? data.original_price_minor / 100),
    salePriceMajor: Number(data.sale_price ?? data.sale_price_minor / 100),
    stockQuantity: inventory?.stock_quantity ?? 0,
    status: data.status as any,
    isFeatured: data.is_featured,
    sellingUnit: data.selling_unit ?? "",
    imageUrls: imageUrlsToText(images),
    hasVariants: data.has_variants,
  };
}

export async function adminGetDefaultStoreId() {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("stores").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
  return data?.id ?? null;
}
