export const SUPABASE_CATALOG_SLUGS = ["curtains", "prayer-mats", "carpets"] as const;

export type SupabaseCatalogSlug = (typeof SUPABASE_CATALOG_SLUGS)[number];

/** Legacy Prisma slugs → Supabase category slugs */
export const CATEGORY_SLUG_ALIASES: Record<string, SupabaseCatalogSlug> = {
  carpet: "carpets",
};

/** Deprecated slugs — hide from nav/filters (merged into canonical slug) */
export const DEPRECATED_CATEGORY_SLUGS = ["carpet"] as const;

export function normalizeCategorySlug(slug?: string) {
  if (!slug) return slug;
  return CATEGORY_SLUG_ALIASES[slug] ?? slug;
}

export function isSupabaseCatalogSlug(slug: string): slug is SupabaseCatalogSlug {
  return (SUPABASE_CATALOG_SLUGS as readonly string[]).includes(normalizeCategorySlug(slug) ?? "");
}

export function isDeprecatedCategorySlug(slug: string) {
  return (DEPRECATED_CATEGORY_SLUGS as readonly string[]).includes(slug);
}

export function formatCategoryLabel(slug: string, name?: string) {
  if (name) return name;
  if (slug === "prayer-mats") return "Prayer Mats";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}