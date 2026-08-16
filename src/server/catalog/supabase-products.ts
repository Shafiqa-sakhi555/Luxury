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

type SupabaseVariantRow = {
  id: string;
  sku: string;
  name: string | null;
  design: string | null;
  color: string | null;
  quality: string | null;
  size: string | null;
  price_minor: number;
  sale_price_minor: number;
  sort_order: number;
  is_default: boolean;
  is_active: boolean;
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
  original_price_minor: number;
  sale_price_minor: number;
  currency: string;
  selling_unit: string | null;
  included_items: string | null;
  size: string | null;
  fabric: string | null;
  design: string | null;
  sku: string | null;
  has_variants: boolean;
  status: string;
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
  inventory: Array<{
    stock_quantity: number;
    stock_status: string;
  }> | null;
  product_variants: SupabaseVariantRow[];
};

const PRODUCT_SELECT = `
  id,
  category_id,
  name,
  slug,
  short_description,
  description,
  original_price_minor,
  sale_price_minor,
  currency,
  selling_unit,
  included_items,
  size,
  fabric,
  design,
  sku,
  has_variants,
  status,
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
    price_minor,
    sale_price_minor,
    sort_order,
    is_default,
    is_active,
    product_images (
      id,
      image_url,
      alt_text,
      sort_order,
      is_primary
    )
  )
`;

function mapImages(
  images: SupabaseProductRow["product_images"],
  variantId?: string | null
): CatalogProductImage[] {
  return [...(images || [])]
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

async function mapVariants(
  product: SupabaseProductRow
): Promise<CatalogProductVariant[]> {
  const rows = [...(product.product_variants ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  return rows.map((row) => {
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
      originalPriceMinor: row.price_minor,
      salePriceMinor: row.sale_price_minor,
      discountPercentage: row.price_minor > row.sale_price_minor ? Math.round((1 - row.sale_price_minor / row.price_minor) * 100) : 0,
      stockQuantity: null, // Simplified
      stockStatus: null,
      isDefault: row.is_default,
      variantId: row.id,
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
  });
}

export async function mapSupabaseProduct(
  row: SupabaseProductRow
): Promise<CatalogProduct> {
  const inventory = row.inventory?.[0] ?? null;
  const variants = row.has_variants ? await mapVariants(row) : undefined;
  const defaultVariant = variants?.find((v) => v.isDefault) ?? variants?.[0];
  const defaultVariantRow =
    row.product_variants?.find((v) => v.is_default) ?? row.product_variants?.[0];
  const cartVariantId = row.has_variants ? defaultVariant?.variantId ?? null : defaultVariantRow?.id ?? null;
  
  const categoryData = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  const category: CatalogCategory = {
    id: categoryData?.id ?? "",
    name: categoryData?.name ?? "",
    slug: categoryData?.slug ?? "",
    description: categoryData?.description ?? null,
    imageUrl: categoryData?.image_url ?? null,
  };

  const originalPriceMinor = row.has_variants
    ? defaultVariant?.originalPriceMinor ?? row.original_price_minor
    : row.original_price_minor;
  const salePriceMinor = row.has_variants
    ? defaultVariant?.salePriceMinor ?? row.sale_price_minor
    : row.sale_price_minor;
  const discountPercentage = originalPriceMinor > salePriceMinor ? Math.round((1 - salePriceMinor / originalPriceMinor) * 100) : 0;

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
    currency: row.currency ?? "PKR",
    sellingUnit: row.selling_unit,
    includedItems: row.included_items,
    size: row.size,
    fabric: row.fabric,
    design: row.design,
    sku: row.sku,
    isFeatured: row.is_featured,
    category,
    images: galleryImages.length > 0 ? galleryImages : defaultVariant?.images ?? [],
    specifications: [],
    stockQuantity: row.has_variants
      ? defaultVariant?.stockQuantity ?? null
      : inventory?.stock_quantity ?? null,
    stockStatus: row.has_variants
      ? defaultVariant?.stockStatus ?? null
      : inventory?.stock_status ?? null,
    hasVariants: row.has_variants,
    variants,
    variantId: cartVariantId,
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
  // Logic is now handled in products.ts
  return null;
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
    .eq("status", "ACTIVE")
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
  const normalized = normalizeCategorySlug(slug) ?? slug;
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url, cloudinary_public_id")
    .ilike("slug", normalized)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    imageUrl: data.image_url,
    cloudinaryPublicId: data.cloudinary_public_id,
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
    .maybeSingle();

  if (!category) return 0;

  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("status", "ACTIVE")
    .eq("category_id", category.id);

  if (error) {
    console.error("[supabase] countProductsInCategory:", error.message);
    return 0;
  }

  return count ?? 0;
}
