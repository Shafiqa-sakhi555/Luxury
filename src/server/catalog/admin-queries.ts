import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { effectivePriceMinor } from "@/lib/money";
import { resolveCloudinaryImageUrl } from "@/lib/cloudinary/url";
import type {
  AdminCategoryOption,
  AdminProductDetail,
  AdminProductListItem,
  CatalogSource,
} from "@/types/admin-catalog";
import type { AdminProductVariantDetail } from "@/types/category-sizes";
import { listCategorySizes, getCategorySizesConfig } from "@/server/catalog/category-sizes";

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

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
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
      product_images ( image_url, cloudinary_public_id, alt_text, sort_order, is_primary ),
      product_variants ( id, price_minor, sale_price_minor, is_default, is_active )
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
    const images = asArray(row.product_images).sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
    const primary = images.find((img) => img.is_primary) ?? images[0];
    const variants = asArray(row.product_variants as Array<{
      id: string;
      price_minor: number;
      sale_price_minor: number;
      is_default: boolean;
      is_active: boolean;
    }>).filter((v) => v.is_active !== false);

    let priceFromMinor = effectivePriceMinor(row.original_price_minor, row.sale_price_minor);
    if (row.has_variants && variants.length > 0) {
      priceFromMinor = Math.min(
        ...variants.map((v) => effectivePriceMinor(v.price_minor, v.sale_price_minor))
      );
    }

    return {
      id: row.id,
      source: "supabase" as const,
      name: row.name,
      slug: row.slug,
      categoryName: category?.name ?? "—",
      categorySlug: category?.slug ?? "",
      skuCount: row.has_variants ? variants.length : 1,
      priceFromMinor,
      status: row.status as any,
      isFeatured: row.is_featured,
      imageUrl: resolveCloudinaryImageUrl(primary?.image_url, primary?.cloudinary_public_id),
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
      .select("id, name, slug, parent_id")
      .eq("is_active", true)
      .order("sort_order")
      .order("name");

    for (const cat of data ?? []) {
      options.push({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        parentId: cat.parent_id ?? null,
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
      fabric,
      design,
      has_variants,
      status,
      is_featured,
      categories ( name, slug, parent_id ),
      product_images ( image_url, cloudinary_public_id, alt_text, sort_order ),
      inventory ( stock_quantity ),
      product_specifications ( spec_key, spec_value, sort_order ),
      product_variants (
        id,
        sku,
        color,
        size,
        category_size_id,
        custom_width,
        custom_length,
        custom_width_unit,
        custom_length_unit,
        weight,
        dimensions,
        attributes,
        original_price,
        sale_price,
        price_minor,
        sale_price_minor,
        is_default,
        is_active,
        sort_order,
        category_sizes ( label, is_custom ),
        product_variant_inventory ( stock_quantity, stock_status )
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;

  const category = unwrapRelation(data.categories as any);
  const specs = asArray(data.product_specifications as Array<{ spec_key: string; spec_value: string }>);
  const colorsSpec = specs.find((spec) => spec.spec_key === "colors")?.spec_value ?? "";
  const variantRows = asArray(data.product_variants as Array<Record<string, unknown>>);
  const defaultVariant = variantRows.find((variant) => variant.is_default) ?? variantRows[0];
  const colors = colorsSpec || (defaultVariant?.color as string | null) || "";

  const sizeLinkedVariants = variantRows.filter((v) => v.category_size_id);
  const sizesConfig = await getCategorySizesConfig(data.category_id);
  const usesCategorySizes = sizesConfig.sizesEnabled && sizeLinkedVariants.length > 0;
  const variantDetails: AdminProductVariantDetail[] = sizeLinkedVariants
    .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
    .map((row) => {
      const categorySize = unwrapRelation(row.category_sizes as { label?: string; is_custom?: boolean } | null);
      const inventory = unwrapRelation(
        row.product_variant_inventory as { stock_quantity?: number } | null
      );
      const isCustom = Boolean(categorySize?.is_custom);
      return {
        id: row.id as string,
        categorySizeId: row.category_size_id as string,
        sizeLabel: (categorySize?.label ?? row.size ?? "") as string,
        isCustom,
        sku: (row.sku as string) ?? "",
        originalPriceMajor: Number(row.original_price ?? (row.price_minor as number) / 100),
        salePriceMajor: Number(row.sale_price ?? (row.sale_price_minor as number) / 100),
        stockQuantity: inventory?.stock_quantity ?? 0,
        weight: (row.weight as string) ?? "",
        dimensions: (row.dimensions as string) ?? "",
        color: (row.color as string) ?? "",
        customWidth: row.custom_width ? Number(row.custom_width) : undefined,
        customLength: row.custom_length ? Number(row.custom_length) : undefined,
        customWidthUnit: (row.custom_width_unit as AdminProductVariantDetail["customWidthUnit"]) ?? undefined,
        customLengthUnit: (row.custom_length_unit as AdminProductVariantDetail["customLengthUnit"]) ?? undefined,
        attributes: (row.attributes as Record<string, string>) ?? {},
        isDefault: Boolean(row.is_default),
      };
    });

  const parentId = category?.parent_id ?? null;
  const mainCategoryId = parentId ?? data.category_id;
  const sectionId = parentId ? data.category_id : "";
  const inventory = unwrapRelation(data.inventory as any);
  const images = asArray(data.product_images)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((img) => {
      const url = resolveCloudinaryImageUrl(img.image_url, img.cloudinary_public_id);
      if (!url) return null;
      return {
        url,
        publicId: img.cloudinary_public_id ?? "",
        alt: img.alt_text ?? undefined,
        sortOrder: img.sort_order ?? 0,
      };
    })
    .filter((img): img is NonNullable<typeof img> => img !== null);

  return {
    id: data.id,
    categoryId: data.category_id,
    mainCategoryId,
    sectionId,
    colors,
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
    images,
    hasVariants: data.has_variants,
    fabric: data.fabric ?? "",
    design: data.design ?? "",
    usesCategorySizes,
    variantDetails: variantDetails.length > 0 ? variantDetails : undefined,
  };
}

export async function adminGetDefaultStoreId() {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("stores").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
  return data?.id ?? null;
}
