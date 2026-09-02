import type { CatalogProduct, CatalogProductListResult } from "@/types/catalog";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  getSupabaseCategoryBySlug,
  getSupabaseProductBySlug,
  isSupabaseCategorySlug,
  listSupabaseProductsByCategorySlug,
} from "@/server/catalog/supabase-products";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatCategoryLabel, normalizeCategorySlug, isDeprecatedCategorySlug, isSupabaseCatalogSlug } from "@/lib/supabase/catalog-categories";
import { buildCanonicalShopCategories, buildCanonicalShopFilterCategories, shopFilterHref } from "@/lib/catalog/shop-categories";
import { resolveCloudinaryImageUrl } from "@/lib/cloudinary/url";
import { resolveProductDiscountPercentage } from "@/lib/catalog/product-pricing";

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
      selling_unit, size,
      is_featured, status, has_variants,
      categories!inner ( id, name, slug ),
      product_images ( id, image_url, cloudinary_public_id, sort_order, is_primary ),
      product_variants ( id, sku, price_minor, sale_price_minor, is_default, is_active, size )
    `, { count: 'exact' })
    .eq("status", params.status || "ACTIVE");

  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,slug.ilike.%${params.search}%`);
  }

  if (params.categorySlug) {
    const canonicalSlug = await resolveShopCategorySlug(params.categorySlug);
    if (!canonicalSlug) {
      return { items: [], total: 0, page, pageSize, totalPages: 0 };
    }
    query = query.eq("categories.slug", canonicalSlug);
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
    const variants = row.product_variants ?? [];
    const activeVariants = variants.filter(
      (entry: { is_active?: boolean }) => entry.is_active !== false
    );
    const defaultVariant =
      activeVariants.find((entry: { is_default?: boolean }) => entry.is_default) ?? activeVariants[0];
    let originalPriceMinor = row.original_price_minor ?? 0;
    let salePriceMinor = row.sale_price_minor ?? 0;

    if (row.has_variants && activeVariants.length > 0) {
      const salePrices = activeVariants
        .map((entry: { sale_price_minor?: number; price_minor?: number }) => entry.sale_price_minor ?? entry.price_minor ?? 0)
        .filter((price: number) => price > 0);
      const originalPrices = activeVariants
        .map((entry: { price_minor?: number; sale_price_minor?: number }) => entry.price_minor ?? entry.sale_price_minor ?? 0)
        .filter((price: number) => price > 0);
      if (salePrices.length > 0) salePriceMinor = Math.min(...salePrices);
      if (originalPrices.length > 0) originalPriceMinor = Math.min(...originalPrices);
    } else if (salePriceMinor <= 0 && defaultVariant?.sale_price_minor > 0) {
      salePriceMinor = defaultVariant.sale_price_minor;
      originalPriceMinor = defaultVariant.price_minor || defaultVariant.sale_price_minor;
    }

    const sortedImages = [...(row.product_images ?? [])].sort(
      (a: { sort_order?: number }, b: { sort_order?: number }) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );

    return {
      id: row.id,
      source: "supabase",
      name: row.name,
      slug: row.slug,
      shortDescription: row.short_description,
      description: row.description,
      originalPriceMinor,
      salePriceMinor,
      discountPercentage: resolveProductDiscountPercentage({
        salePriceMinor,
        originalPriceMinor,
        sellingUnit: row.selling_unit ?? null,
        categorySlug: category?.slug,
        size: row.size ?? null,
      }),
      currency: "PKR",
      sellingUnit: row.selling_unit ?? null,
      includedItems: null,
      size: row.size ?? null,
      fabric: null,
      design: null,
      sku: defaultVariant?.sku ?? null,
      isFeatured: row.is_featured,
      hasVariants: Boolean(row.has_variants),
      variantCount: row.has_variants ? activeVariants.length : 0,
      category: {
        id: category?.id ?? "",
        name: category?.name ?? "",
        slug: category?.slug ?? "",
        description: null,
        imageUrl: null,
      },
      images: sortedImages
        .map((img: { id: string; image_url: string; sort_order?: number; is_primary?: boolean; cloudinary_public_id?: string | null }) => {
          const url = resolveCloudinaryImageUrl(img.image_url, img.cloudinary_public_id);
          if (!url) return null;
          return {
            id: img.id,
            url,
            alt: row.name,
            sortOrder: img.sort_order ?? 0,
            isPrimary: img.is_primary ?? false,
          };
        })
        .filter(Boolean) as CatalogProduct["images"],
      specifications: [],
      stockQuantity: null,
      stockStatus: null,
      variantId: row.has_variants ? null : (defaultVariant?.id ?? null),
      brand: null,
    };
  });

  const fetched = (page - 1) * pageSize + items.length;
  const total = Math.max(count ?? 0, fetched);
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

export async function listShopNavCategories() {
  const rows = await listActiveShopCategories();
  const canonical = buildCanonicalShopCategories(rows);
  const seen = new Set(canonical.map((cat) => cat.slug));

  const extras = rows
    .filter((row) => {
      const slug = normalizeCategorySlug(row.slug) ?? row.slug;
      return !seen.has(slug as (typeof canonical)[number]["slug"]);
    })
    .map((row) => {
      const slug = normalizeCategorySlug(row.slug) ?? row.slug;
      return {
        slug,
        label: row.name,
        description: row.description?.trim() || "",
        href: `/categories/${slug}`,
      };
    });

  return [...canonical, ...extras];
}

export async function listShopFilterCategories() {
  const rows = await listActiveShopCategories();

  return rows.map((row) => {
    const slug = normalizeCategorySlug(row.slug) ?? row.slug;
    return {
      label: row.name,
      slug,
      description: row.description?.trim() || "",
      href: isSupabaseCatalogSlug(slug)
        ? shopFilterHref(slug)
        : `/shop?category=${encodeURIComponent(slug)}`,
    };
  });
}

export async function listShopCategoryCards() {
  const rows = await listActiveShopCategories();

  return rows.map((row) => {
    const slug = normalizeCategorySlug(row.slug) ?? row.slug;
    const canonical = buildCanonicalShopCategories(rows).find((cat) => cat.slug === slug);

    return {
      slug,
      title: row.name,
      description:
        row.description?.trim() ||
        canonical?.description ||
        `Browse our ${row.name.toLowerCase()} collection.`,
      href: `/categories/${slug}`,
      imageUrl: row.image_url ?? null,
    };
  });
}

async function listActiveShopCategories() {
  if (!isSupabaseConfigured()) return [];

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("categories")
    .select("name, slug, description, image_url, parent_id")
    .eq("is_active", true)
    .is("parent_id", null)
    .order("sort_order", { ascending: true });

  const rows = data ?? [];

  return rows.filter((row) => {
    const slug = normalizeCategorySlug(row.slug) ?? row.slug;
    return !isDeprecatedCategorySlug(slug);
  });
}

export async function resolveShopCategorySlug(inputSlug?: string | null) {
  if (!inputSlug || !isSupabaseConfigured()) return null;

  const normalized = normalizeCategorySlug(inputSlug) ?? inputSlug;
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("categories")
    .select("slug")
    .ilike("slug", normalized)
    .maybeSingle();

  return data?.slug ?? null;
}

export async function listCategories(includeDraft = false) {
  if (!isSupabaseConfigured()) return [];
  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("categories")
    .select("*, products(count)")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (!includeDraft) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  type CategoryNode = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    heroImage: string | null;
    heroImagePublicId: string | null;
    parentId: string | null;
    sortOrder: number;
    status: "ACTIVE" | "ARCHIVED";
    _count: { products: number };
    children: CategoryNode[];
  };

  const nodes = new Map<string, CategoryNode>();

  for (const cat of data ?? []) {
    nodes.set(cat.id, {
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
    });
  }

  const roots: CategoryNode[] = [];

  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId)!.children.push(node);
      continue;
    }
    if (!node.parentId) {
      roots.push(node);
    }
  }

  for (const root of roots) {
    root.children.sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
    );
  }

  return roots;
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
      heroImage: resolveCloudinaryImageUrl(category.imageUrl, category.cloudinaryPublicId),
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
