import { revalidatePath } from "next/cache";
import { normalizeCategorySlug } from "@/lib/supabase/catalog-categories";

/** Invalidate storefront pages after admin catalog changes. */
export function revalidateStorefrontCatalog(categorySlugs: string[] = []) {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/", "layout");

  const slugs = new Set(
    categorySlugs
      .map((slug) => normalizeCategorySlug(slug) ?? slug)
      .filter((slug): slug is string => Boolean(slug))
  );

  for (const slug of slugs) {
    revalidatePath(`/categories/${slug}`);
  }
}
