import {
  normalizeCategorySlug,
  SUPABASE_CATALOG_SLUGS,
  type SupabaseCatalogSlug,
} from "@/lib/supabase/catalog-categories";

export type CanonicalShopCategory = {
  slug: SupabaseCatalogSlug;
  label: string;
  description: string;
  href: string;
};

/** Storefront navigation — only these three categories appear in nav, shop filters, and homepage. */
export const CANONICAL_SHOP_CATEGORY_META: Record<
  SupabaseCatalogSlug,
  { label: string; description: string }
> = {
  curtains: {
    label: "Curtains",
    description:
      "Premium curtain collections — fabrics, finishes, and custom sizing for every room.",
  },
  carpets: {
    label: "Carpets & Rugs",
    description: "Handpicked carpets and rugs — traditional, modern, and custom sizes.",
  },
  "prayer-mats": {
    label: "Prayer Mats",
    description: "Quality prayer mats in a range of styles, materials, and sizes.",
  },
};

export function categoryHref(slug: SupabaseCatalogSlug) {
  return `/categories/${slug}`;
}

export function buildCanonicalShopCategories(
  dbRows: Array<{ name: string; slug: string; description?: string | null }> = []
): CanonicalShopCategory[] {
  const bySlug = new Map(
    dbRows.map((row) => [normalizeCategorySlug(row.slug) ?? row.slug, row])
  );

  const slugs = SUPABASE_CATALOG_SLUGS.filter((slug) => bySlug.has(slug));

  return slugs.map((slug) => {
    const db = bySlug.get(slug);
    const meta = CANONICAL_SHOP_CATEGORY_META[slug];
    return {
      slug,
      label: db?.name ?? meta.label,
      description: db?.description?.trim() || meta.description,
      href: categoryHref(slug),
    };
  });
}

export function isCanonicalShopSlug(slug: string): slug is SupabaseCatalogSlug {
  const normalized = normalizeCategorySlug(slug) ?? slug;
  return (SUPABASE_CATALOG_SLUGS as readonly string[]).includes(normalized);
}

export function shopFilterHref(slug: SupabaseCatalogSlug) {
  return `/shop?category=${encodeURIComponent(slug)}`;
}

export function buildCanonicalShopFilterCategories(
  dbRows: Array<{ name: string; slug: string; description?: string | null }> = []
) {
  return buildCanonicalShopCategories(dbRows).map((cat) => ({
    label: cat.label,
    slug: cat.slug,
    description: cat.description,
    href: shopFilterHref(cat.slug),
  }));
}
