import type { Metadata } from "next";
import { Package } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { listProducts, getCategoryBySlug } from "@/server/catalog/products";
import { ProductCard } from "@/components/commerce/ProductCard";
import { ProductGrid } from "@/components/commerce/ProductGrid";
import { CatalogHero } from "@/components/commerce/CatalogHero";
import { CatalogPagination } from "@/components/commerce/CatalogPagination";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { normalizeCategorySlug } from "@/lib/supabase/catalog-categories";
import { getOptimizedImageUrl, isRenderableImageUrl, resolveCloudinaryImageUrl } from "@/lib/cloudinary/url";
import { STOREFRONT_PRODUCT_PAGE_SIZE } from "@/lib/catalog/storefront-pagination";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const normalizedSlug = normalizeCategorySlug(slug) ?? slug;
  const category = await getCategoryBySlug(normalizedSlug).catch(() => null);
  if (!category) return { title: "Category not found" };
  return {
    title: `${category.name} | Shop`,
    description:
      category.description ??
      `Browse ${category.name} — premium home furnishings from Jalal's Home Solution.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const normalizedSlug = normalizeCategorySlug(slug) ?? slug;

  if (normalizedSlug !== slug) {
    redirect(`/categories/${normalizedSlug}${sp.page ? `?page=${sp.page}` : ""}`);
  }

  const page = Math.max(1, Number(sp.page ?? 1));

  const [category, productResult] = await Promise.all([
    getCategoryBySlug(normalizedSlug).catch(() => null),
    listProducts({
      categorySlug: normalizedSlug,
      page,
      pageSize: STOREFRONT_PRODUCT_PAGE_SIZE,
    }).catch(() => ({
      items: [],
      total: 0,
      totalPages: 0,
      page: 1,
      pageSize: STOREFRONT_PRODUCT_PAGE_SIZE,
    })),
  ]);

  if (!category) notFound();

  const { items, total, totalPages } = productResult;

  const heroImageCandidate =
    ("heroImage" in category && category.heroImage) ||
    ("heroImagePublicId" in category && category.heroImagePublicId
      ? resolveCloudinaryImageUrl(null, category.heroImagePublicId)
      : null) ||
    items[0]?.images[0]?.url ||
    null;
  const heroImageSrc = isRenderableImageUrl(heroImageCandidate)
    ? getOptimizedImageUrl(heroImageCandidate, { width: 1920, crop: "limit" })
    : null;

  const countLabel =
    total > 0
      ? `${total} product${total !== 1 ? "s" : ""} available${totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}`
      : undefined;

  return (
    <div>
      <CatalogHero
        eyebrow="Collection"
        title={category.name}
        description={
          category.description ??
          `Premium ${category.name.toLowerCase()} — quality craftsmanship for your home.`
        }
        countLabel={countLabel}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: category.name },
        ]}
        heroImageSrc={heroImageSrc}
      />

      <PageContainer className="py-10 sm:py-12">
        {items.length === 0 ? (
          <EmptyState
            className="surface-card"
            icon={<Package className="h-6 w-6" />}
            title="Coming soon"
            description="We're adding new products to this collection. Browse the full catalog or ask Jalal Assistance for recommendations."
            action={{ label: "Browse all products", href: "/shop" }}
          />
        ) : (
          <ProductGrid>
            {items.map((product, i) => (
              <ProductCard
                key={`${product.source}-${product.id}`}
                product={product}
                index={i}
                priorityImage={i < 4}
              />
            ))}
          </ProductGrid>
        )}

        {items.length > 0 ? (
          <CatalogPagination
            className="mt-12"
            page={Math.min(page, Math.max(totalPages, 1))}
            totalPages={totalPages}
            pathname={`/categories/${normalizedSlug}`}
          />
        ) : null}
      </PageContainer>
    </div>
  );
}
