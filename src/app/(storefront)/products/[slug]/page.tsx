import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts } from "@/server/catalog/products";
import {
  ProductSimpleDetail,
  ProductVariantSelector,
} from "@/components/commerce/ProductVariantSelector";
import { ProductCard } from "@/components/commerce/ProductCard";
import { PageContainer } from "@/components/ui/page-container";
import { Section } from "@/components/ui/section";

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

  const related = await getRelatedProducts(slug, product.category.slug).catch(() => []);
  const isCollection = product.hasVariants && (product.variants?.length ?? 0) > 0;

  return (
    <div className="bg-white">
      <PageContainer className="pb-16 pt-site-header">
        {isCollection ? (
          <ProductVariantSelector product={product} />
        ) : (
          <ProductSimpleDetail product={product} />
        )}

        {related.length > 0 ? (
          <Section spacing="none" className="mt-16 border-t border-navy/10 pt-14 lg:mt-20 lg:pt-16">
            <h2 className="font-display text-2xl text-navy sm:text-3xl">You may also like</h2>
            <p className="mt-2 text-sm text-muted">More from {product.category.name}</p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
              {related.map((item, index) => (
                <ProductCard key={`${item.source}-${item.id}`} product={item} index={index} />
              ))}
            </div>
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
