"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ProductCard } from "@/components/commerce/ProductCard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { CatalogProduct } from "@/types/catalog";

type FilterItem = {
  label: string;
  slug?: string;
};

export function PropertiesShowcase({
  products,
  filterCategories,
  initialCategorySlug,
  showViewAllLink = true,
}: {
  products: CatalogProduct[];
  filterCategories: FilterItem[];
  initialCategorySlug?: string;
  showViewAllLink?: boolean;
}) {
  const [activeSlug, setActiveSlug] = useState<string | undefined>(initialCategorySlug);

  useEffect(() => {
    setActiveSlug(initialCategorySlug);
  }, [initialCategorySlug]);

  const filters = useMemo<FilterItem[]>(
    () => [{ label: "All", slug: undefined }, ...filterCategories],
    [filterCategories]
  );

  const filtered = useMemo(() => {
    if (!activeSlug) return products;
    return products.filter((product) => product.category.slug === activeSlug);
  }, [activeSlug, products]);

  return (
    <section id="products" className="relative overflow-hidden section-brand-light py-16 sm:py-24">
      <div className="blob-red left-0 top-10 h-64 w-64 opacity-50" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Weekly Bestsellers"
            title={showViewAllLink ? "Handpicked For Your Home" : "Shop Catalog"}
            description="Premium carpets, rugs, furniture and decor — curated deals with transparent pricing."
            className="mb-0"
          />
          {showViewAllLink && (
            <Link href="/shop" className="shrink-0">
              <Button variant="outline" size="lg">
                View All Products
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        {filters.length > 1 && (
          <div className="mb-8 mt-10 flex gap-2 overflow-x-auto pb-2 hide-scrollbar sm:mb-12 sm:flex-wrap sm:gap-3">
            {filters.map((filter) => (
              <button
                key={filter.slug ?? "all"}
                type="button"
                onClick={() => setActiveSlug(filter.slug)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-xs transition-all duration-300 sm:px-5 sm:text-sm",
                  activeSlug === filter.slug || (!activeSlug && !filter.slug)
                    ? "bg-red font-medium text-white shadow-md shadow-red/20"
                    : "border border-navy/10 bg-white text-navy/70 hover:border-red/30 hover:bg-red/5 hover:text-navy"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-navy/10 bg-white p-12 text-center shadow-sm ring-1 ring-navy/5">
            <p className="font-display text-xl text-navy">No products in this category yet</p>
            <p className="mt-2 text-muted">Browse our full catalog for more options.</p>
            <Link
              href="/shop"
              className="mt-6 inline-flex rounded-full bg-red px-6 py-2.5 text-sm font-medium text-white transition hover:bg-red/90"
            >
              View all products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
            {filtered.map((product, index) => (
              <ProductCard
                key={`${product.source}-${product.id}`}
                product={product}
                index={index}
                priorityImage={index < 4}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
