import { requireAdminPageAccess } from "@/server/admin/page-access";
import { listAdminReviews } from "@/server/reviews/queries";
import {
  listAdminProductReviews,
  listProductReviewProductOptions,
} from "@/server/product-reviews/queries";
import { ReviewsAdminTabs } from "@/components/admin/catalog/ReviewsAdminTabs";

export default async function AdminReviewsPage() {
  await requireAdminPageAccess("catalog.write");
  const [homepageReviews, productReviews, products] = await Promise.all([
    listAdminReviews().catch(() => []),
    listAdminProductReviews().catch(() => []),
    listProductReviewProductOptions().catch(() => []),
  ]);

  return (
    <ReviewsAdminTabs
      homepageReviews={homepageReviews}
      productReviews={productReviews}
      products={products}
    />
  );
}
