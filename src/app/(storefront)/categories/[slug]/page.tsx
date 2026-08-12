import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { listProducts, getCategoryBySlug } from "@/server/catalog/products";
import { ProductCard } from "@/components/commerce/ProductCard";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Footer } from "@/components/layout/Footer";
import { normalizeCategorySlug } from "@/lib/supabase/catalog-categories";

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

  const heroImage =
    "heroImage" in category && category.heroImage
      ? category.heroImage
      : items[0]?.images[0]?.url ?? null;

  return (
    <div>
      <section className="relative overflow-hidden section-brand-light pt-28">
        {heroImage && (
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt={category.name}
              fill
              className="object-cover opacity-20"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-brand-50/80 via-brand-50/95 to-brand-50" />
          </div>
        )}
        {!heroImage && <div className="blob-red right-0 top-10 h-72 w-72 opacity-40" />}

        <div className="relative mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
          <nav className="mb-6 text-sm text-muted">
            <Link href="/" className="transition hover:text-red">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/shop" className="transition hover:text-red">
              Shop
            </Link>
            <span className="mx-2">/</span>
            <span className="text-navy">{category.name}</span>
          </nav>

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
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-navy/10 bg-white p-12 text-center shadow-sm ring-1 ring-navy/5">
            <p className="font-display text-xl text-navy">Coming soon</p>
            <p className="mt-2 text-muted">
              We&apos;re adding new products to this collection. Check back soon.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex rounded-full bg-red px-6 py-2.5 text-sm font-medium text-white transition hover:bg-red/90"
            >
              Browse all products
            </Link>
          </div>
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

        {totalPages > 1 && (
          <div className="mt-12 flex flex-wrap justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/categories/${normalizedSlug}?page=${p}`}
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
