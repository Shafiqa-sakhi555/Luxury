import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts } from "@/server/catalog/products";
import { listPublishedProductReviews } from "@/server/product-reviews/queries";
import { getStoreSettings } from "@/server/settings/store-settings";
import { formatMoney } from "@/lib/money";
import {
  ProductSimpleDetail,
} from "@/components/commerce/ProductVariantSelector";
import { ProductCard } from "@/components/commerce/ProductCard";
import { ProductGrid } from "@/components/commerce/ProductGrid";
import { Breadcrumbs } from "@/components/commerce/Breadcrumbs";
import { PageContainer } from "@/components/ui/page-container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/shared/SectionHeading";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);
  if (!product) notFound();

  const [related, reviews, settings] = await Promise.all([
    getRelatedProducts(slug, product.category.slug).catch(() => []),
    listPublishedProductReviews(product.id),
    getStoreSettings(),
  ]);
  const deliveryFeeLabel = formatMoney(settings.deliveryFeeMinor);
  const freeDeliveryThresholdLabel = formatMoney(settings.freeDeliveryThresholdMinor);

  return (
    <div className="bg-luxury-cream">
      <PageContainer className="pb-16 pt-site-header">
        <Breadcrumbs
          className="mb-8"
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            { label: product.category.name, href: `/categories/${product.category.slug}` },
            { label: product.name },
          ]}
        />

        <ProductSimpleDetail
          product={product}
          reviews={reviews}
          deliveryFeeLabel={deliveryFeeLabel}
          freeDeliveryThresholdLabel={freeDeliveryThresholdLabel}
        />

        {related.length > 0 ? (
          <Section spacing="none" className="mt-16 border-t border-navy/10 pt-14 lg:mt-20 lg:pt-16">
            <SectionHeading
              eyebrow="More to love"
              title="You may also like"
              description={`More from ${product.category.name}`}
              className="mb-8 sm:mb-10"
            />
            <ProductGrid>
              {related.map((item, index) => (
                <ProductCard key={`${item.source}-${item.id}`} product={item} index={index} />
              ))}
            </ProductGrid>
          </Section>
        ) : null}
      </PageContainer>
    </div>
  );
}

export async function generateStaticParams() {
  try {
    const { listProducts } = await import("@/server/catalog/products");
    const { items } = await listProducts({ pageSize: 200 });
    return items.map((product) => ({ slug: product.slug }));
  } catch {
    return [];
  }
}
