import { listCategories } from "@/server/catalog/products";
import { CategoryManager } from "@/components/admin/catalog/CategoryManager";
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
  const categories = await listCategories(true).catch(() => []);

  const rows: AdminCategoryRow[] = categories
    .filter((category) => !category.parentId)
    .map(mapCategory);

  return <CategoryManager categories={rows} />;
}
