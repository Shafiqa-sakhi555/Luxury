import Image from "next/image";
import type { Metadata } from "next";
import { Package } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { listProducts, getCategoryBySlug } from "@/server/catalog/products";
import { ProductCard } from "@/components/commerce/ProductCard";
import { Breadcrumbs } from "@/components/commerce/Breadcrumbs";
import { CatalogPagination } from "@/components/commerce/CatalogPagination";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { normalizeCategorySlug } from "@/lib/supabase/catalog-categories";
import { getOptimizedImageUrl, isRenderableImageUrl, resolveCloudinaryImageUrl } from "@/lib/cloudinary/url";

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
      pageSize: 24,
    }).catch(() => ({
      items: [],
      total: 0,
      totalPages: 0,
      page: 1,
      pageSize: 24,
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

  return (
    <div>
      <section className="relative overflow-hidden section-brand-light pt-28">
        {heroImageSrc && (
          <div className="absolute inset-0">
            <Image
              src={heroImageSrc}
              alt={category.name}
              fill
              className="object-cover opacity-20"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-brand-50/80 via-brand-50/95 to-brand-50" />
          </div>
        )}
        {!heroImageSrc && <div className="blob-red right-0 top-10 h-72 w-72 opacity-40" />}

        <PageContainer className="relative pb-12 sm:pb-16">
          <Breadcrumbs
            className="mb-6"
            items={[
              { label: "Home", href: "/" },
              { label: "Shop", href: "/shop" },
              { label: category.name },
            ]}
          />

          <SectionHeading
            eyebrow="Collection"
            title={category.name}
            description={
              category.description ??
              `Premium ${category.name.toLowerCase()} — quality craftsmanship for your home.`
            }
            className="mb-0"
          />

          {total > 0 && (
            <p className="mt-6 text-sm text-muted">
              {total} product{total !== 1 ? "s" : ""} available
              {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
            </p>
          )}
        </PageContainer>
      </section>

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
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
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

        <CatalogPagination
          className="mt-12"
          page={page}
          totalPages={totalPages}
          buildHref={(p) => `/categories/${normalizedSlug}?page=${p}`}
        />
      </PageContainer>
    </div>
  );
}
