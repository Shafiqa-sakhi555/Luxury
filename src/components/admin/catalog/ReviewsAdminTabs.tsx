"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ReviewManager } from "@/components/admin/catalog/ReviewManager";
import { ProductReviewManager } from "@/components/admin/catalog/ProductReviewManager";
import type { AdminReviewRow } from "@/types/admin-review";
import type { AdminProductReviewRow, ProductReviewProductOption } from "@/types/product-review";

export function ReviewsAdminTabs({
  homepageReviews,
  productReviews,
  products,
}: {
  homepageReviews: AdminReviewRow[];
  productReviews: AdminProductReviewRow[];
  products: ProductReviewProductOption[];
}) {
  const [tab, setTab] = useState<"homepage" | "product">("product");

  return (
    <div>
      <div className="mb-6 flex gap-2 border-b border-navy/10">
        <button
          type="button"
          onClick={() => setTab("product")}
          className={cn(
            "-mb-px border-b-2 px-3 py-2 text-sm font-medium",
            tab === "product"
              ? "border-navy text-navy"
              : "border-transparent text-muted hover:text-navy"
          )}
        >
          Product feedback
        </button>
        <button
          type="button"
          onClick={() => setTab("homepage")}
          className={cn(
            "-mb-px border-b-2 px-3 py-2 text-sm font-medium",
            tab === "homepage"
              ? "border-navy text-navy"
              : "border-transparent text-muted hover:text-navy"
          )}
        >
          Homepage
        </button>
      </div>

      {tab === "product" ? (
        <ProductReviewManager reviews={productReviews} products={products} />
      ) : (
        <ReviewManager reviews={homepageReviews} />
      )}
    </div>
  );
}
