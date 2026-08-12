import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Check, Truck, Shield, Ruler } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/server/catalog/products";
import { AddToCartButton } from "@/components/commerce/AddToCartButton";
import { ProductGallery } from "@/components/commerce/ProductGallery";
import { ProductVariantSelector } from "@/components/commerce/ProductVariantSelector";
import { ProductCard } from "@/components/commerce/ProductCard";
import { formatMoney } from "@/lib/money";
import { Footer } from "@/components/layout/Footer";

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
  const hasDiscount = product.originalPriceMinor > product.salePriceMinor;
  const inStock =
    product.stockStatus === "in_stock" ||
    product.stockStatus === "unknown" ||
    product.stockStatus === null;

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
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <nav className="mb-8 text-sm text-muted">
          <Link href="/" className="transition hover:text-red">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/categories/${product.category.slug}`} className="transition hover:text-red">
            {product.category.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-navy">{product.name}</span>
        </nav>

        {isCollection ? (
          <>
            <div className="mb-8 max-w-3xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-blue">
                {product.category.name}
              </p>
              <h1 className="mt-2 font-display text-3xl leading-tight text-navy sm:text-4xl lg:text-5xl">
                {product.name}
              </h1>
              {product.shortDescription && (
                <p className="mt-4 text-base leading-relaxed text-muted">
                  {product.shortDescription}
                </p>
              )}
            </div>
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

            <div className="lg:pt-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-blue">
                {product.category.name}
              </p>
              <h1 className="mt-2 font-display text-3xl leading-tight text-navy sm:text-4xl lg:text-5xl">
                {product.name}
              </h1>

              {product.shortDescription && (
                <p className="mt-4 text-base leading-relaxed text-muted">
                  {product.shortDescription}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {inStock ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald/10 px-3 py-1 text-xs font-medium text-emerald">
                    <Check className="h-3.5 w-3.5" />
                    In stock
                  </span>
                ) : (
                  <span className="rounded-full bg-navy/10 px-3 py-1 text-xs font-medium text-navy/70">
                    Out of stock
                  </span>
                )}
                {product.sku && <span className="text-xs text-muted">SKU: {product.sku}</span>}
              </div>

              <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-navy/8">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="font-display text-3xl font-medium text-navy sm:text-4xl">
                    {formatMoney(product.salePriceMinor)}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-lg text-muted line-through">
                        {formatMoney(product.originalPriceMinor)}
                      </span>
                      <span className="rounded-md bg-red px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
                        Save {Math.round(product.discountPercentage)}%
                      </span>
                    </>
                  )}
                </div>
                {priceSubtitle && <p className="mt-2 text-sm text-muted">{priceSubtitle}</p>}

                {product.variantId && inStock && (
                  <div className="mt-6 border-t border-navy/10 pt-6">
                    <AddToCartButton variantId={product.variantId} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <ul className="mt-8 grid gap-3 sm:grid-cols-3">
          {trustPoints.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-xs text-navy/80"
            >
              <Icon className="h-4 w-4 shrink-0 text-red" />
              {label}
            </li>
          ))}
        </ul>

        {!isCollection && specs.length > 0 && (
          <dl className="mt-10 grid gap-3 sm:grid-cols-2">
            {specs.map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-white p-4 ring-1 ring-navy/8">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {label}
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-navy">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {product.description && (
          <div className="mt-10 border-t border-navy/10 pt-8">
            <h2 className="font-display text-2xl text-navy">About this product</h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted">
              {product.description}
            </p>
          </div>
        )}

        {related.length > 0 && (
          <section className="mt-20 border-t border-navy/10 pt-16">
            <h2 className="font-display text-3xl text-navy">You may also like</h2>
            <p className="mt-2 text-muted">More from {product.category.name}</p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
              {related.map((item, i) => (
                <ProductCard key={`${item.source}-${item.id}`} product={item} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
      <Footer />
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
