import Link from "next/link";
import { listCategories } from "@/server/catalog/products";
import { AdminPageHeader, AdminCard } from "@/components/admin/layout/AdminPageHeader";

export default async function AdminCategoriesPage() {
  const categories = await listCategories(true).catch(() => []);

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description="13-category tree with parent/child hierarchy"
      />
      <AdminCard className="divide-y divide-navy/5">
        {categories.length === 0 ? (
          <p className="p-6 text-sm text-muted">No categories yet. Run the database seed.</p>
        ) : (
          categories
            .filter((c) => !c.parentId)
            .map((category) => (
              <div key={category.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-navy">{category.name}</p>
                    <p className="text-xs text-muted">/{category.slug} · {category._count.products} products</p>
                  </div>
                  <span className="text-xs text-muted">{category.status}</span>
                </div>
                {category.children.length > 0 && (
                  <div className="mt-3 ml-4 space-y-2 border-l border-navy/10 pl-4">
                    {category.children.map((child) => (
                      <div key={child.id} className="flex items-center justify-between text-sm">
                        <span>{child.name}</span>
                        <span className="text-xs text-muted">/{child.slug}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
        )}
      </AdminCard>
      <p className="mt-4 text-sm text-muted">
        <Link href="/admin/catalog/products" className="text-navy hover:underline">
          Back to products
        </Link>
      </p>
    </div>
  );
}
