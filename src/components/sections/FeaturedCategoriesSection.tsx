"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { CategoryCardGrid, type ShopCategoryCard } from "@/components/commerce/CategoryCardGrid";
import { CatalogPagination } from "@/components/commerce/CatalogPagination";
import {
  paginateItems,
  HOMEPAGE_CATEGORY_PAGE_SIZE,
} from "@/lib/catalog/storefront-pagination";

export type { ShopCategoryCard };

export function FeaturedCategoriesSection({ categories }: { categories: ShopCategoryCard[] }) {
  const [page, setPage] = useState(1);

  const paged = useMemo(
    () => paginateItems(categories, page, HOMEPAGE_CATEGORY_PAGE_SIZE),
    [categories, page]
  );

  useEffect(() => {
    if (page !== paged.page) setPage(paged.page);
  }, [page, paged.page]);

  if (categories.length === 0) return null;

  function goToPage(next: number) {
    setPage(next);
    document.getElementById("categories")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section id="categories" className="relative bg-white section-spacing-md">
      <div className="page-container">
        <SectionHeading
          eyebrow="Collections"
          title="Shop by Category"
          description="Explore our most sought-after categories — curated for elegant, modern living."
          align="center"
        />

        <div className="mt-10">
          <CategoryCardGrid categories={paged.items} />
        </div>

        <CatalogPagination
          className="mt-10"
          page={paged.page}
          totalPages={paged.totalPages}
          onPageChange={goToPage}
        />

        {paged.totalPages > 1 ? (
          <p className="mt-4 text-center text-sm text-navy/50">
            Page {paged.page} of {paged.totalPages}
            {" · "}
            <Link href="/categories" className="font-medium text-red hover:underline">
              View all collections
            </Link>
          </p>
        ) : (
          <p className="mt-8 text-center">
            <Link href="/categories" className="text-sm font-medium text-red hover:underline">
              View all collections
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
