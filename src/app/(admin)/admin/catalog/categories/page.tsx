import { listCategories } from "@/server/catalog/products";
import { CategoryManager } from "@/components/admin/catalog/CategoryManager";
import { requireAdminPageAccess } from "@/server/admin/page-access";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { AdminCategoryRow } from "@/types/admin-category";

function mapCategory(
  category: Awaited<ReturnType<typeof listCategories>>[number]
): AdminCategoryRow {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    heroImage: category.heroImage,
    heroImagePublicId: category.heroImagePublicId ?? null,
    parentId: category.parentId,
    sortOrder: category.sortOrder,
    status: category.status as any,
    productCount: category._count.products,
    children: category.children.map((child: any) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      description: child.description,
      heroImage: child.heroImage,
      heroImagePublicId: child.heroImagePublicId ?? null,
      parentId: child.parentId,
      sortOrder: child.sortOrder,
      status: child.status as any,
      productCount: child._count.products,
    })),
  };
}

export default async function AdminCategoriesPage() {
  await requireAdminPageAccess("catalog.write", "category.write");

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-lg border border-red/20 bg-red/5 px-4 py-3 text-sm text-red">
        Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and
        SUPABASE_SERVICE_ROLE_KEY to your environment variables.
      </div>
    );
  }

  const categories = await listCategories(true);

  const rows: AdminCategoryRow[] = categories.map(mapCategory);

  return <CategoryManager categories={rows} />;
}
