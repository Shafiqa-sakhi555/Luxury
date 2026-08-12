import Link from "next/link";
import type { Metadata } from "next";
import { listProducts, listShopFilterCategories, getCategoryBySlug } from "@/server/catalog/products";
import { ProductCard } from "@/components/commerce/ProductCard";
import { CatalogFilterPills } from "@/components/commerce/CatalogFilterPills";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Footer } from "@/components/layout/Footer";
import { normalizeCategorySlug, formatCategoryLabel } from "@/lib/supabase/catalog-categories";

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
  const categorySlug = normalizeCategorySlug(params.category);
  const [{ items, totalPages }, filterCategories, activeCategoryRecord] = await Promise.all([
    listProducts({
      categorySlug,
      search: params.q,
      page,
      pageSize: 24,
    }).catch(() => ({ items: [], total: 0, page: 1, pageSize: 24, totalPages: 0 })),
    listShopFilterCategories().catch(() => []),
    categorySlug ? getCategoryBySlug(categorySlug).catch(() => null) : Promise.resolve(null),
  ]);

  const activeCategory = activeCategoryRecord
    ? { name: activeCategoryRecord.name, slug: categorySlug ?? params.category ?? "" }
    : categorySlug
      ? { name: formatCategoryLabel(categorySlug), slug: categorySlug }
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
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <CatalogFilterPills items={filterItems} activeSlug={categorySlug ?? params.category} />

        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-navy/10 bg-white p-12 text-center shadow-sm ring-1 ring-navy/5">
            <p className="font-display text-xl text-navy">No products found</p>
            <p className="mt-2 text-muted">Try another category or browse our full collection.</p>
            <Link
              href="/shop"
              className="mt-6 inline-flex rounded-full bg-red px-6 py-2.5 text-sm font-medium text-white transition hover:bg-red/90"
            >
              View all products
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
            {items.map((product, i) => (
              <ProductCard key={`${product.source}-${product.id}`} product={product} index={i} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-12 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/shop?category=${params.category ?? ""}&page=${p}`}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  p === page
                    ? "bg-red font-medium text-white shadow-md shadow-red/20"
                    : "border border-navy/10 bg-white text-navy/70 hover:border-red/30 hover:bg-red/5"
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
