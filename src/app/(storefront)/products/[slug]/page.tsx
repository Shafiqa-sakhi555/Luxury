import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Truck, Shield, Ruler } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/server/catalog/products";
import { ProductGallery } from "@/components/commerce/ProductGallery";
import { ProductVariantSelector } from "@/components/commerce/ProductVariantSelector";
import { ProductCard } from "@/components/commerce/ProductCard";
import { Breadcrumbs } from "@/components/commerce/Breadcrumbs";
import { ProductPurchasePanel } from "@/components/commerce/ProductPurchasePanel";
import { ProductSpecsGrid, ProductTrustStrip } from "@/components/commerce/ProductDetailsBlocks";
import { PageContainer } from "@/components/ui/page-container";
import { Section } from "@/components/ui/section";

function formatSpecLabel(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

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

const trustPoints = [
  { icon: Truck, label: "Nationwide delivery" },
  { icon: Shield, label: "Quality guaranteed" },
  { icon: Ruler, label: "Custom sizes available" },
];

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);
  if (!product) notFound();

  const related = await getRelatedProducts(slug, product.category.slug).catch(() => []);

  const specs = [
    product.includedItems && { label: "What's included", value: product.includedItems },
    product.size && { label: "Size", value: product.size },
    product.fabric && { label: "Fabric", value: product.fabric },
    product.design && { label: "Design", value: product.design },
    product.sellingUnit && { label: "Unit", value: product.sellingUnit },
    ...product.specifications.map((s) => ({
      label: formatSpecLabel(s.key),
      value: s.value,
    })),
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const priceSubtitle = [product.sellingUnit, product.size].filter(Boolean).join(" · ");
  const isCollection = product.hasVariants && (product.variants?.length ?? 0) > 0;

  return (
    <div>
      <PageContainer className="pb-16 pt-28 sm:pt-32">
        <Breadcrumbs
          className="mb-8"
          items={[
            { label: "Home", href: "/" },
            { label: product.category.name, href: `/categories/${product.category.slug}` },
            { label: product.name },
          ]}
        />

        {isCollection ? (
          <>
            <header className="mb-8 max-w-3xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-blue">
                {product.category.name}
              </p>
              <h1 className="mt-2 font-display text-3xl leading-tight text-navy sm:text-4xl lg:text-5xl">
                {product.name}
              </h1>
              {product.shortDescription ? (
                <p className="mt-4 text-base leading-relaxed text-muted">
                  {product.shortDescription}
                </p>
              ) : null}
            </header>
            <ProductVariantSelector product={product} />
          </>
        ) : (
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <ProductGallery
              images={product.images.map((img) => ({
                id: img.id,
                url: img.url,
                alt: img.alt,
                sortOrder: img.sortOrder,
              }))}
              productName={product.name}
            />

            <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
              <header>
                <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-blue">
                  {product.category.name}
                </p>
                <h1 className="mt-2 font-display text-3xl leading-tight text-navy sm:text-4xl lg:text-5xl">
                  {product.name}
                </h1>
                {product.shortDescription ? (
                  <p className="mt-4 text-base leading-relaxed text-muted">
                    {product.shortDescription}
                  </p>
                ) : null}
              </header>

              <ProductPurchasePanel
                salePriceMinor={product.salePriceMinor}
                originalPriceMinor={product.originalPriceMinor}
                discountPercentage={product.discountPercentage}
                priceSubtitle={priceSubtitle}
                sellingUnit={product.sellingUnit}
                sku={product.sku}
                stockStatus={product.stockStatus}
                variantId={product.variantId}
                productName={product.name}
              />
            </div>
          </div>
        )}

        <div className="mt-10 space-y-10">
          <ProductTrustStrip items={trustPoints} />

          {!isCollection && specs.length > 0 ? (
            <section aria-labelledby="product-specs">
              <h2 id="product-specs" className="font-display text-2xl text-navy">
                Specifications
              </h2>
              <div className="mt-5">
                <ProductSpecsGrid specs={specs} />
              </div>
            </section>
          ) : null}

          {product.description ? (
            <section aria-labelledby="product-about" className="border-t border-navy/10 pt-8">
              <h2 id="product-about" className="font-display text-2xl text-navy">
                About this product
              </h2>
              <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-muted">
                {product.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-4 text-sm">
                <Link href="/delivery" className="text-navy underline-offset-2 hover:underline">
                  Delivery information
                </Link>
                <Link href="/warranty" className="text-navy underline-offset-2 hover:underline">
                  Warranty
                </Link>
                <Link href="/returns" className="text-navy underline-offset-2 hover:underline">
                  Returns policy
                </Link>
              </div>
            </section>
          ) : null}
        </div>

        {related.length > 0 ? (
          <Section spacing="none" className="mt-20 border-t border-navy/10 pt-16">
            <h2 className="font-display text-3xl text-navy">You may also like</h2>
            <p className="mt-2 text-muted">More from {product.category.name}</p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
              {related.map((item, i) => (
                <ProductCard key={`${item.source}-${item.id}`} product={item} index={i} />
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
    return items.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}
