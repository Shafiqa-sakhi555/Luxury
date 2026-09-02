import type { Metadata } from "next";
import { listShopCategoryCards } from "@/server/catalog/products";
import { CatalogHero } from "@/components/commerce/CatalogHero";
import { CatalogPagination } from "@/components/commerce/CatalogPagination";
import { CategoryCardGrid } from "@/components/commerce/CategoryCardGrid";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import {
  paginateItems,
  STOREFRONT_CATEGORY_PAGE_SIZE,
} from "@/lib/catalog/storefront-pagination";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Collections",
  description: "Browse every Jalal's Home Solution collection — carpets, furniture, bedding, and more.",
};

export default async function CategoriesIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const requestedPage = Math.max(1, Number(params.page ?? 1) || 1);
  const categories = await listShopCategoryCards().catch(() => []);
  const paged = paginateItems(categories, requestedPage, STOREFRONT_CATEGORY_PAGE_SIZE);

  const countLabel =
    paged.total > 0
      ? `${paged.total} collection${paged.total !== 1 ? "s" : ""}${
          paged.totalPages > 1 ? ` · page ${paged.page} of ${paged.totalPages}` : ""
        }`
      : undefined;

  return (
    <div>
      <CatalogHero
        eyebrow="Collections"
        title="Shop by Category"
        description="Explore our most sought-after categories — curated for elegant, modern living."
        countLabel={countLabel}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Collections" },
        ]}
      />

      <PageContainer className="relative py-10 sm:py-12">
        {paged.items.length === 0 ? (
          <EmptyState
            className="surface-card"
            title="No collections yet"
            description="We're preparing new collections. Browse the full catalog in the meantime."
            action={{ label: "View all products", href: "/shop" }}
          />
        ) : (
          <CategoryCardGrid categories={paged.items} />
        )}

        <CatalogPagination
          className="mt-12"
          page={paged.page}
          totalPages={paged.totalPages}
          pathname="/categories"
        />
      </PageContainer>
    </div>
  );
}
