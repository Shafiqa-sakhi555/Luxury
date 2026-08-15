import Link from "next/link";
import { adminListAllProducts, adminListCategoryOptions } from "@/server/catalog/admin-queries";
import { requireAdminPageAccess } from "@/server/admin/page-access";
import { canWriteProducts } from "@/server/rbac";
import { AdminPageHeader, AdminCard } from "@/components/admin/layout/AdminPageHeader";
import { AdminBadge } from "@/components/admin/ui";
import { ProductListFilters } from "@/components/admin/catalog/ProductListFilters";
import { RepairProductImagesButton } from "@/components/admin/catalog/RepairProductImagesButton";
import { formatMoney } from "@/lib/money";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string; category?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireAdminPageAccess("product.write");
  const page = Number(params.page ?? 1);

  const [result, categoryOptions] = await Promise.all([
    adminListAllProducts({
      page,
      search: params.search,
      status: params.status as "ACTIVE" | "DRAFT" | "ARCHIVED" | undefined,
      categorySlug: params.category,
    }).catch(() => ({ items: [], total: 0, page: 1, pageSize: 25, totalPages: 0 })),
    adminListCategoryOptions().catch(() => []),
  ]);

  const filterCategories = categoryOptions.map((cat) => ({ slug: cat.slug, name: cat.name }));

  return (
    <div>
      <AdminPageHeader
        title="Products"
        description="Add, edit, and remove products across your storefront catalog"
        actions={
          canWriteProducts(ctx.permissions) ? (
            <div className="flex flex-wrap items-center gap-2">
              <RepairProductImagesButton />
              <Link
                href="/admin/catalog/products/new"
                className="inline-flex h-9 items-center rounded-lg bg-navy px-4 text-sm font-medium text-white hover:bg-navy/90"
              >
                New product
              </Link>
            </div>
          ) : null
        }
      />

      <AdminCard className="mb-4 p-4">
        <ProductListFilters
          search={params.search}
          status={params.status}
          categorySlug={params.category}
          categories={filterCategories}
        />
      </AdminCard>

      <AdminCard className="overflow-hidden">
        <div className="border-b border-navy/10 px-4 py-3 text-xs text-muted">
          {result.total} product{result.total === 1 ? "" : "s"} in catalog
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-navy/10 bg-[#FAFBFD] text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">SKUs</th>
                <th className="px-4 py-3">Price from</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {result.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted">
                    No products found.{" "}
                    <Link href="/admin/catalog/products/new" className="text-navy hover:underline">
                      Add your first product
                    </Link>
                  </td>
                </tr>
              ) : (
                result.items.map((product) => (
                  <tr key={product.id} className="border-b border-navy/5 hover:bg-navy/[0.02]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-lg bg-navy/5">
                          {product.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-navy">{product.name}</p>
                          <p className="text-xs text-muted">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{product.categoryName}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {product.skuCount}
                      {product.hasVariants ? "+" : ""}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {product.priceFromMinor ? formatMoney(product.priceFromMinor) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <AdminBadge
                        tone={
                          product.status === "ACTIVE"
                            ? "success"
                            : product.status === "DRAFT"
                              ? "warning"
                              : "muted"
                        }
                      >
                        {product.status}
                      </AdminBadge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/catalog/products/${product.id}`}
                        className="text-navy hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {result.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-navy/10 px-4 py-3 text-sm">
            <span className="text-muted">
              Page {result.page} of {result.totalPages}
            </span>
            <div className="flex gap-2">
              {result.page > 1 && (
                <Link
                  href={`?page=${result.page - 1}${params.search ? `&search=${params.search}` : ""}${params.status ? `&status=${params.status}` : ""}${params.category ? `&category=${params.category}` : ""}`}
                  className="rounded-lg border border-navy/10 px-3 py-1.5 hover:bg-navy/5"
                >
                  Previous
                </Link>
              )}
              {result.page < result.totalPages && (
                <Link
                  href={`?page=${result.page + 1}${params.search ? `&search=${params.search}` : ""}${params.status ? `&status=${params.status}` : ""}${params.category ? `&category=${params.category}` : ""}`}
                  className="rounded-lg border border-navy/10 px-3 py-1.5 hover:bg-navy/5"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
