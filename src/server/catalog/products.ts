import type { CatalogProduct, CatalogProductListResult } from "@/types/catalog";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  getSupabaseCategoryBySlug,
  getSupabaseProductBySlug,
  isSupabaseCategorySlug,
  listSupabaseProductsByCategorySlug,
} from "@/server/catalog/supabase-products";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatCategoryLabel } from "@/lib/supabase/catalog-categories";

export type ProductListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  categorySlug?: string;
  brandSlug?: string;
  status?: "ACTIVE" | "DRAFT" | "ARCHIVED";
  sort?: "newest" | "price_asc" | "price_desc" | "name";
};

export async function listProducts(
  params: ProductListParams = {}
): Promise<CatalogProductListResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 24));
  
  if (!isSupabaseConfigured()) {
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("products")
    .select(`
      id, name, slug, short_description, description, original_price_minor, sale_price_minor,
      is_featured, status,
      categories!inner ( id, name, slug ),
      product_images ( id, image_url, sort_order, is_primary ),
      product_variants ( id, sku, price_minor, sale_price_minor )
    `, { count: 'exact' })
    .eq("status", params.status || "ACTIVE");

  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,slug.ilike.%${params.search}%`);
  }

  if (params.categorySlug) {
    query = query.eq('categories.slug', params.categorySlug);
  }

  // Sorting
  if (params.sort === "name") query = query.order("name", { ascending: true });
  else if (params.sort === "price_asc") query = query.order("sale_price_minor", { ascending: true });
  else if (params.sort === "price_desc") query = query.order("sale_price_minor", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  const { data, count, error } = await query.range(start, end);

  if (error || !data) {
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const items: CatalogProduct[] = data.map((row: any) => {
    const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
    const variant = row.product_variants?.[0];
    
    return {
      id: row.id,
      source: "supabase",
      name: row.name,
      slug: row.slug,
      shortDescription: row.short_description,
      description: row.description,
      originalPriceMinor: row.original_price_minor,
      salePriceMinor: row.sale_price_minor,
      discountPercentage: row.original_price_minor > row.sale_price_minor ? Math.round((1 - row.sale_price_minor / row.original_price_minor) * 100) : 0,
      currency: "PKR",
      sellingUnit: null,
      includedItems: null,
      size: null,
      fabric: null,
      design: null,
      sku: variant?.sku ?? null,
      isFeatured: row.is_featured,
      category: {
        id: category?.id ?? "",
        name: category?.name ?? "",
        slug: category?.slug ?? "",
        description: null,
        imageUrl: null,
      },
      images: (row.product_images ?? []).map((img: any) => ({
        id: img.id,
        url: img.image_url,
        alt: row.name,
        sortOrder: img.sort_order,
        isPrimary: img.is_primary,
      })),
      specifications: [],
      stockQuantity: null,
      stockStatus: null,
      variantId: variant?.id ?? null,
      brand: null,
    };
  });

  const total = count ?? 0;
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getProductBySlug(
  slug: string,
  admin = false
): Promise<CatalogProduct | null> {
  if (!isSupabaseConfigured()) return null;
  const supabaseProduct = await getSupabaseProductBySlug(slug);
  return supabaseProduct;
}

export async function getRelatedProducts(slug: string, categorySlug: string) {
  const result = await listProducts({ categorySlug, pageSize: 4 });
  return result.items.filter((p) => p.slug !== slug).slice(0, 4);
}

export async function listShopFilterCategories() {
  if (!isSupabaseConfigured()) return [];
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("categories").select("name, slug").order("sort_order", { ascending: true });
  
  return (data ?? []).map(cat => ({
    label: cat.name,
    href: `/shop?category=${cat.slug}`,
    slug: cat.slug
  }));
}

export async function listCategories(includeDraft = false) {
  if (!isSupabaseConfigured()) return [];
  const supabase = createSupabaseAdminClient();
  
  const { data } = await supabase
    .from("categories")
    .select("*, products(count)")
    .is("parent_id", null)
    .order("sort_order", { ascending: true });

  return (data ?? []).map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    heroImage: cat.image_url,
    heroImagePublicId: cat.cloudinary_public_id ?? null,
    parentId: cat.parent_id,
    sortOrder: cat.sort_order,
    status: cat.is_active ? "ACTIVE" : "ARCHIVED",
    _count: { products: cat.products?.[0]?.count ?? 0 },
    children: [],
  }));
}

export async function getCategoryBySlug(slug: string) {
  if (!isSupabaseConfigured()) return null;
  const category = await getSupabaseCategoryBySlug(slug);
  if (category) {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      heroImage: category.imageUrl,
      heroImagePublicId: category.cloudinaryPublicId ?? null,
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
  return null;
}

export async function listBrands() {
  return []; // Brands removed in Supabase schema for now
}

export async function adminListProducts(params: ProductListParams = {}) {
  const result = await listProducts(params);
  return result;
}
