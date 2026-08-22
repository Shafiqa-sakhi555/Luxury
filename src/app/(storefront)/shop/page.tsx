import type { Metadata } from "next";
import { listProducts, listShopFilterCategories, getCategoryBySlug, resolveShopCategorySlug } from "@/server/catalog/products";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SupabaseSetupNotice } from "@/components/shared/SupabaseSetupNotice";
import { ProductCard } from "@/components/commerce/ProductCard";
import { CatalogFilterPills } from "@/components/commerce/CatalogFilterPills";
import { CatalogPagination } from "@/components/commerce/CatalogPagination";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { normalizeCategorySlug, formatCategoryLabel } from "@/lib/supabase/catalog-categories";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse carpets, rugs, curtains, furniture, flooring and home décor.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const supabaseReady = isSupabaseConfigured();
  const requestedCategorySlug = normalizeCategorySlug(params.category);
  const resolvedCategorySlug = requestedCategorySlug
    ? await resolveShopCategorySlug(requestedCategorySlug)
    : null;
  const [{ items, total, totalPages }, filterCategories, activeCategoryRecord] = await Promise.all([
    listProducts({
      categorySlug: requestedCategorySlug ?? undefined,
      search: params.q,
      page,
      pageSize: 24,
    }).catch(() => ({ items: [], total: 0, page: 1, pageSize: 24, totalPages: 0 })),
    listShopFilterCategories().catch(() => []),
    resolvedCategorySlug
      ? getCategoryBySlug(resolvedCategorySlug).catch(() => null)
      : Promise.resolve(null),
  ]);

  const activeCategory = activeCategoryRecord
    ? { name: activeCategoryRecord.name, slug: resolvedCategorySlug ?? params.category ?? "" }
    : resolvedCategorySlug
      ? { name: formatCategoryLabel(resolvedCategorySlug), slug: resolvedCategorySlug }
      : null;

  const filterItems = [
    { label: "All", href: "/shop", slug: undefined as string | undefined },
    ...filterCategories.map((cat) => ({
      label: cat.label,
      href: cat.href,
      slug: cat.slug,
    })),
  ];

  return (
    <div>
      <section className="relative overflow-hidden section-brand-light pt-28 pb-12 sm:pb-16">
        <div className="blob-red left-0 top-10 h-64 w-64 opacity-40" />
        <PageContainer className="relative">
          <SectionHeading
            eyebrow="Shop"
            title={activeCategory ? activeCategory.name : "Full Catalog"}
            description={
              activeCategory
                ? `Browse our ${activeCategory.name.toLowerCase()} collection — premium quality with transparent pricing.`
                : "Browse carpets, rugs, curtains, furniture, flooring and home décor — curated for elegant living."
            }
            className="mb-0"
          />
          {total > 0 && (
            <p className="mt-4 text-sm text-muted">
              {total} product{total !== 1 ? "s" : ""}
              {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
            </p>
          )}
        </PageContainer>
      </section>

      <PageContainer className="relative py-10 sm:py-12">
        {!supabaseReady && <SupabaseSetupNotice className="mb-8" />}

        <CatalogFilterPills
          items={filterItems}
          activeSlug={resolvedCategorySlug ?? params.category}
        />

        {items.length === 0 ? (
          <EmptyState
            className="mt-10 surface-card"
            title={params.q ? "No matching products" : "No products found"}
            description={
              params.q
                ? `We couldn't find results for "${params.q}". Try another search or browse categories.`
                : "Try another category or browse our full collection."
            }
            action={{ label: "View all products", href: "/shop" }}
          />
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
            {items.map((product, i) => (
              <ProductCard
                key={`${product.source}-${product.id}`}
                product={product}
                index={i}
                priorityImage={i < 4}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <CatalogPagination
            className="mt-12"
            page={page}
            totalPages={totalPages}
            buildHref={(p) => {
              const query = new URLSearchParams();
              if (params.category) query.set("category", params.category);
              if (params.q) query.set("q", params.q);
              if (p > 1) query.set("page", String(p));
              return query.size ? `/shop?${query.toString()}` : "/shop";
            }}
          />
        )}
      </PageContainer>
    </div>
  );
}
