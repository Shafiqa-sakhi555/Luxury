import Link from "next/link";
import { adminListAllProducts, adminListCategoryOptions } from "@/server/catalog/admin-queries";
import { requireAdminPageAccess } from "@/server/admin/page-access";
import { canWriteProducts, canDeleteProducts } from "@/server/rbac";
import { AdminPageHeader, AdminCard } from "@/components/admin/layout/AdminPageHeader";
import {
  AdminTable,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableHead,
  AdminTableCell,
  AdminTableEmpty,
  AdminTableToolbar,
  AdminPagination,
  ProductStatusBadge,
} from "@/components/admin/ui";
import { ProductListFilters } from "@/components/admin/catalog/ProductListFilters";
import { ProductRowActions } from "@/components/admin/catalog/ProductRowActions";
import { RepairProductImagesButton } from "@/components/admin/catalog/RepairProductImagesButton";
import { formatMoney } from "@/lib/money";

function buildProductsHref(
  page: number,
  params: { search?: string; status?: string; category?: string }
) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.category) query.set("category", params.category);
  if (page > 1) query.set("page", String(page));
  const qs = query.toString();
  return qs ? `/admin/catalog/products?${qs}` : "/admin/catalog/products";
}

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
        <AdminTableToolbar>
          <p className="text-sm text-muted">
            {result.total} product{result.total === 1 ? "" : "s"} in catalog
          </p>
        </AdminTableToolbar>

        <AdminTable>
          <AdminTableHeader>
            <tr>
              <AdminTableHead>Product</AdminTableHead>
              <AdminTableHead>Category</AdminTableHead>
              <AdminTableHead>SKUs</AdminTableHead>
              <AdminTableHead>Price from</AdminTableHead>
              <AdminTableHead>Status</AdminTableHead>
              <AdminTableHead align="right"> </AdminTableHead>
            </tr>
          </AdminTableHeader>
          <AdminTableBody>
            {result.items.length === 0 ? (
              <AdminTableEmpty
                colSpan={6}
                title="No products found"
                description="Try adjusting your filters or add a new product."
                action={{ label: "Add product", href: "/admin/catalog/products/new" }}
              />
            ) : (
              result.items.map((product) => (
                <AdminTableRow key={product.id}>
                  <AdminTableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-lg bg-navy/5 ring-1 ring-navy/8">
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-medium text-navy">{product.name}</p>
                        <p className="text-xs text-muted">{product.slug}</p>
                      </div>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell className="text-muted">{product.categoryName}</AdminTableCell>
                  <AdminTableCell className="tabular-nums">
                    {product.skuCount}
                    {product.hasVariants ? "+" : ""}
                  </AdminTableCell>
                  <AdminTableCell className="tabular-nums">
                    {product.priceFromMinor ? formatMoney(product.priceFromMinor) : "—"}
                  </AdminTableCell>
                  <AdminTableCell>
                    <ProductStatusBadge status={product.status} />
                  </AdminTableCell>
                  <AdminTableCell align="right">
                    <ProductRowActions
                      id={product.id}
                      name={product.name}
                      canDelete={canDeleteProducts(ctx.permissions)}
                    />
                  </AdminTableCell>
                </AdminTableRow>
              ))
            )}
          </AdminTableBody>
        </AdminTable>

        <AdminPagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          pageSize={result.pageSize}
          buildHref={(p) => buildProductsHref(p, params)}
        />
      </AdminCard>
    </div>
  );
}
