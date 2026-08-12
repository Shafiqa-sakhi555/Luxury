import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isSupabaseCatalogSlug, normalizeCategorySlug } from "@/lib/supabase/catalog-categories";
import type {
  CatalogCategory,
  CatalogProduct,
  CatalogProductImage,
  CatalogProductListResult,
  CatalogProductSpec,
  CatalogProductVariant,
} from "@/types/catalog";
import { db } from "@/server/db";
import { syncPrismaVariantForSupabaseProduct } from "@/server/catalog/supabase-sync";

type SupabaseVariantRow = {
  id: string;
  sku: string;
  name: string | null;
  design: string | null;
  color: string | null;
  quality: string | null;
  size: string | null;
  original_price: number;
  sale_price: number;
  discount_percentage: number;
  sort_order: number;
  is_default: boolean;
  is_active: boolean;
  product_variant_inventory: Array<{
    stock_quantity: number | null;
    stock_status: string;
  }> | null;
  product_images: Array<{
    id: string;
    image_url: string;
    alt_text: string | null;
    sort_order: number;
    is_primary: boolean;
  }>;
};

type SupabaseProductRow = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  original_price: number;
  sale_price: number;
  discount_percentage: number;
  currency: string;
  selling_unit: string | null;
  included_items: string | null;
  size: string | null;
  fabric: string | null;
  design: string | null;
  sku: string | null;
  has_variants: boolean;
  is_active: boolean;
  is_featured: boolean;
  categories: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
  };
  product_images: Array<{
    id: string;
    image_url: string;
    alt_text: string | null;
    sort_order: number;
    is_primary: boolean;
    variant_id: string | null;
  }>;
  product_specifications: Array<{
    spec_key: string;
    spec_value: string;
    sort_order: number;
  }>;
  inventory: Array<{
    stock_quantity: number;
    stock_status: string;
  }> | null;
  product_variants: SupabaseVariantRow[];
};

/** Lean select for product grids — avoids nested variant galleries and specs. */
const PRODUCT_LIST_SELECT = `
  id,
  name,
  slug,
  short_description,
  original_price,
  sale_price,
  discount_percentage,
  currency,
  selling_unit,
  size,
  sku,
  has_variants,
  is_featured,
  created_at,
  categories (
    id,
    name,
    slug,
    description,
    image_url
  ),
  product_images (
    id,
    image_url,
    alt_text,
    sort_order,
    is_primary,
    variant_id
  ),
  inventory (
    stock_quantity,
    stock_status
  ),
  product_variants (
    sku,
    is_default,
    original_price,
    sale_price,
    discount_percentage,
    sort_order
  )
`;

const PRODUCT_SELECT = `
  id,
  category_id,
  name,
  slug,
  short_description,
  description,
  original_price,
  sale_price,
  discount_percentage,
  currency,
  selling_unit,
  included_items,
  size,
  fabric,
  design,
  sku,
  has_variants,
  is_active,
  is_featured,
  categories (
    id,
    name,
    slug,
    description,
    image_url
  ),
  product_images (
    id,
    image_url,
    alt_text,
    sort_order,
    is_primary,
    variant_id
  ),
  product_specifications (
    spec_key,
    spec_value,
    sort_order
  ),
  inventory (
    stock_quantity,
    stock_status
  ),
  product_variants (
    id,
    sku,
    name,
    design,
    color,
    quality,
    size,
    original_price,
    sale_price,
    discount_percentage,
    sort_order,
    is_default,
    is_active,
    product_variant_inventory (
      stock_quantity,
      stock_status
    ),
    product_images (
      id,
      image_url,
      alt_text,
      sort_order,
      is_primary
    )
  )
`;

function pkrToMinor(amount: number) {
  return Math.round(amount * 100);
}

function mapImages(
  images: SupabaseProductRow["product_images"],
  variantId?: string | null
): CatalogProductImage[] {
  return [...images]
    .filter((img) =>
      variantId === undefined
        ? true
        : variantId === null
          ? img.variant_id === null
          : img.variant_id === variantId
    )
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => ({
      id: img.id,
      url: img.image_url,
      alt: img.alt_text,
      sortOrder: img.sort_order,
      isPrimary: img.is_primary,
    }));
}

function mapSpecs(specs: SupabaseProductRow["product_specifications"]): CatalogProductSpec[] {
  return [...specs]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((s) => ({
      key: s.spec_key,
      value: s.spec_value,
      sortOrder: s.sort_order,
    }));
}

async function resolvePrismaVariantIdBySku(sku: string) {
  const variant = await db.productVariant.findUnique({
    where: { sku },
    select: { id: true },
  });
  return variant?.id ?? null;
}

export async function batchResolvePrismaVariantIds(
  skus: string[]
): Promise<Map<string, string>> {
  const unique = [...new Set(skus.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const variants = await db.productVariant.findMany({
    where: { sku: { in: unique } },
    select: { id: true, sku: true },
  });

  return new Map(variants.map((variant) => [variant.sku, variant.id]));
}

type SupabaseProductListRow = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  original_price: number;
  sale_price: number;
  discount_percentage: number;
  currency: string;
  selling_unit: string | null;
  size: string | null;
  sku: string | null;
  has_variants: boolean;
  is_featured: boolean;
  created_at: string;
  categories: SupabaseProductRow["categories"];
  product_images: SupabaseProductRow["product_images"];
  inventory: SupabaseProductRow["inventory"];
  product_variants: Array<{
    sku: string;
    is_default: boolean;
    original_price: number;
    sale_price: number;
    discount_percentage: number;
    sort_order: number;
  }>;
};

function listRowSkus(row: SupabaseProductListRow): string[] {
  if (row.has_variants) {
    const variants = [...(row.product_variants ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    );
    const preferred = variants.find((variant) => variant.is_default) ?? variants[0];
    return preferred?.sku ? [preferred.sku] : [];
  }
  return row.sku ? [row.sku] : [];
}

function mapSupabaseProductForList(
  row: SupabaseProductListRow,
  skuToVariantId: Map<string, string>
): CatalogProduct {
  const variants = row.has_variants
    ? [...(row.product_variants ?? [])].sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const defaultVariant = variants.find((variant) => variant.is_default) ?? variants[0];
  const inventory = row.inventory?.[0] ?? null;

  const originalPriceMinor = row.has_variants
    ? pkrToMinor(Number(defaultVariant?.original_price ?? row.original_price))
    : pkrToMinor(Number(row.original_price));
  const salePriceMinor = row.has_variants
    ? pkrToMinor(Number(defaultVariant?.sale_price ?? row.sale_price))
    : pkrToMinor(Number(row.sale_price));
  const discountPercentage = row.has_variants
    ? Number(defaultVariant?.discount_percentage ?? row.discount_percentage)
    : Number(row.discount_percentage);

  const galleryImages = mapImages(row.product_images, row.has_variants ? null : undefined);
  const cartSku = row.has_variants ? defaultVariant?.sku ?? null : row.sku;

  return {
    id: row.id,
    source: "supabase",
    name: row.name,
    slug: row.slug,
    shortDescription: row.short_description,
    description: null,
    originalPriceMinor,
    salePriceMinor,
    discountPercentage,
    currency: row.currency,
    sellingUnit: row.selling_unit,
    includedItems: null,
    fabric: null,
    design: null,
    size: row.size,
    sku: cartSku,
    isFeatured: row.is_featured,
    category: {
      id: row.categories.id,
      name: row.categories.name,
      slug: row.categories.slug,
      description: row.categories.description,
      imageUrl: row.categories.image_url,
    },
    images: galleryImages.slice(0, 1),
    specifications: [],
    stockQuantity: inventory?.stock_quantity ?? null,
    stockStatus: inventory?.stock_status ?? null,
    hasVariants: row.has_variants,
    variantId: cartSku ? skuToVariantId.get(cartSku) ?? null : null,
    brand: null,
  };
}

async function resolveVariantId(product: SupabaseProductRow): Promise<string | null> {
  if (product.has_variants) return null;
  if (!product.sku) return null;

  try {
    const variant = await syncPrismaVariantForSupabaseProduct({
      supabaseId: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      shortDescription: product.short_description,
      description: product.description,
      originalPriceMinor: pkrToMinor(Number(product.original_price)),
      salePriceMinor: pkrToMinor(Number(product.sale_price)),
      categorySlug: product.categories.slug,
      primaryImageUrl:
        product.product_images.find((i) => i.is_primary && !i.variant_id)?.image_url ??
        product.product_images.find((i) => !i.variant_id)?.image_url ??
        null,
      images: mapImages(product.product_images, null).map((img) => ({
        url: img.url,
        alt: img.alt,
        sortOrder: img.sortOrder,
      })),
    });
    return variant.id;
  } catch {
    return resolvePrismaVariantIdBySku(product.sku);
  }
}

async function mapVariants(
  product: SupabaseProductRow
): Promise<CatalogProductVariant[]> {
  const rows = [...(product.product_variants ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  return Promise.all(
    rows.map(async (row) => {
      const inventory = row.product_variant_inventory?.[0] ?? null;
      const images =
        row.product_images?.length > 0
          ? row.product_images
          : product.product_images.filter((img) => img.variant_id === row.id);

      return {
        id: row.id,
        sku: row.sku,
        name: row.name,
        design: row.design,
        color: row.color,
        quality: row.quality,
        size: row.size,
        originalPriceMinor: pkrToMinor(Number(row.original_price)),
        salePriceMinor: pkrToMinor(Number(row.sale_price)),
        discountPercentage: Number(row.discount_percentage),
        stockQuantity: inventory?.stock_quantity ?? null,
        stockStatus: inventory?.stock_status ?? null,
        isDefault: row.is_default,
        variantId: await resolvePrismaVariantIdBySku(row.sku),
        images: [...images]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((img) => ({
            id: img.id,
            url: img.image_url,
            alt: img.alt_text,
            sortOrder: img.sort_order,
            isPrimary: img.is_primary,
          })),
      };
    })
  );
}

export async function mapSupabaseProduct(
  row: SupabaseProductRow,
  withVariant = true
): Promise<CatalogProduct> {
  const inventory = row.inventory?.[0] ?? null;
  const variants = row.has_variants ? await mapVariants(row) : undefined;
  const defaultVariant = variants?.find((v) => v.isDefault) ?? variants?.[0];
  const category: CatalogCategory = {
    id: row.categories.id,
    name: row.categories.name,
    slug: row.categories.slug,
    description: row.categories.description,
    imageUrl: row.categories.image_url,
  };

  const originalPriceMinor = row.has_variants
    ? defaultVariant?.originalPriceMinor ?? pkrToMinor(Number(row.original_price))
    : pkrToMinor(Number(row.original_price));
  const salePriceMinor = row.has_variants
    ? defaultVariant?.salePriceMinor ?? pkrToMinor(Number(row.sale_price))
    : pkrToMinor(Number(row.sale_price));
  const discountPercentage = row.has_variants
    ? defaultVariant?.discountPercentage ?? Number(row.discount_percentage)
    : Number(row.discount_percentage);

  const galleryImages = row.has_variants
    ? mapImages(row.product_images, null)
    : mapImages(row.product_images);

  return {
    id: row.id,
    source: "supabase",
    name: row.name,
    slug: row.slug,
    shortDescription: row.short_description,
    description: row.description,
    originalPriceMinor,
    salePriceMinor,
    discountPercentage,
    currency: row.currency,
    sellingUnit: row.selling_unit,
    includedItems: row.included_items,
    size: row.size,
    fabric: row.fabric,
    design: row.design,
    sku: row.sku,
    isFeatured: row.is_featured,
    category,
    images:
      galleryImages.length > 0
        ? galleryImages
        : defaultVariant?.images ?? [],
    specifications: mapSpecs(row.product_specifications),
    stockQuantity: row.has_variants
      ? defaultVariant?.stockQuantity ?? null
      : inventory?.stock_quantity ?? null,
    stockStatus: row.has_variants
      ? defaultVariant?.stockStatus ?? null
      : inventory?.stock_status ?? null,
    hasVariants: row.has_variants,
    variants,
    variantId: row.has_variants
      ? defaultVariant?.variantId ?? null
      : withVariant
        ? await resolveVariantId(row)
        : null,
    brand: null,
  };
}

async function getSupabaseClient(useAdmin = false) {
  if (useAdmin) {
    return createSupabaseAdminClient();
  }
  return createSupabaseServerClient();
}

export async function listSupabaseProductsByCategorySlug(
  categorySlug: string,
  params: { page?: number; pageSize?: number; search?: string } = {}
): Promise<CatalogProductListResult | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await getSupabaseClient();

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .eq("is_active", true)
    .maybeSingle();

  if (categoryError || !category) {
    if (categoryError) console.error("[supabase] category lookup:", categoryError.message);
    return null;
  }

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 24));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("products")
    .select(PRODUCT_LIST_SELECT, { count: "exact" })
    .eq("is_active", true)
    .eq("category_id", category.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.search) {
    const term = params.search.replace(/[%_,().]/g, " ").trim();
    if (term) {
      query = query.or(
        `name.ilike.%${term}%,slug.ilike.%${term}%,sku.ilike.%${term}%`
      );
    }
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[supabase] listProductsByCategorySlug:", error.message);
    return null;
  }

  const rows = (data ?? []) as unknown as SupabaseProductListRow[];
  const skuMap = await batchResolvePrismaVariantIds(rows.flatMap(listRowSkus));
  const items = rows.map((row) => mapSupabaseProductForList(row, skuMap));

  const total = count ?? 0;
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getSupabaseProductBySlug(
  slug: string
): Promise<CatalogProduct | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[supabase] getProductBySlug:", error.message);
    return null;
  }

  return mapSupabaseProduct(data as unknown as SupabaseProductRow);
}

export async function getSupabaseCategoryBySlug(
  slug: string
): Promise<CatalogCategory | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    imageUrl: data.image_url,
  };
}

export async function isSupabaseCategorySlug(slug: string) {
  if (!isSupabaseConfigured()) return false;
  const normalized = normalizeCategorySlug(slug) ?? slug;
  return isSupabaseCatalogSlug(normalized);
}

export async function countSupabaseProductsInCategory(categorySlug: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  const supabase = await getSupabaseClient();
  const { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .eq("is_active", true)
    .maybeSingle();

  if (!category) return 0;

  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .eq("category_id", category.id);

  if (error) {
    console.error("[supabase] countProductsInCategory:", error.message);
    return 0;
  }

  return count ?? 0;
}
