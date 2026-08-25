import { requireAdminPageAccess } from "@/server/admin/page-access";
import { listAdminReviews } from "@/server/reviews/queries";
import { ReviewManager } from "@/components/admin/catalog/ReviewManager";

export default async function AdminReviewsPage() {
  await requireAdminPageAccess("catalog.write");
  const reviews = await listAdminReviews().catch(() => []);

  return <ReviewManager reviews={reviews} />;
}
