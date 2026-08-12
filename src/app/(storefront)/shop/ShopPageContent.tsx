"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PropertiesShowcase } from "@/components/sections/PropertiesShowcase";
import { Footer } from "@/components/layout/Footer";
import { categories } from "@/lib/categories";

/** Map URL category slugs to product filter labels */
function slugToFilter(slug: string | null): string {
  if (!slug) return "All";

  const map: Record<string, string> = {
    carpet: "Carpet",
    carpets: "Carpet",
    rugs: "Rugs",
    rug: "Rugs",
    furniture: "Sofa",
    sofa: "Sofa",
    beds: "Beds",
    bed: "Beds",
    decor: "Decor",
    curtain: "Decor",
    curtains: "Decor",
    cushions: "Decor",
  };

  return map[slug] ?? "All";
}

export function ShopPageContent() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category");
  const initialFilter = slugToFilter(categorySlug);
  const activeCategory = categories.find((c) => c.slug === categorySlug);

  return (
    <div className="relative bg-white pt-28 sm:pt-32">
      <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-xs text-muted sm:text-sm">
          <Link href="/" className="hover:text-red">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-navy">Shop</span>
          {activeCategory && (
            <>
              <span className="mx-2">/</span>
              <span className="text-navy">{activeCategory.name}</span>
            </>
          )}
        </nav>
        {activeCategory && (
          <p className="mt-2 max-w-2xl text-sm text-muted">{activeCategory.description}</p>
        )}
      </div>

      <PropertiesShowcase initialFilter={initialFilter} showViewAllLink={false} />

      <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <p className="text-center text-xs text-muted">
          Full catalog loading soon — showing sample products for now.
        </p>
      </div>

      <Footer />
    </div>
  );
}
