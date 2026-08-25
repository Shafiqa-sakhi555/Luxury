import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AdminReviewRow, StorefrontReview } from "@/types/admin-review";

const FALLBACK_IMAGE = "/images/placeholders/1494790108377-be9c29b29330.jpg";

function mapAdminRow(row: {
  id: string;
  reviewer_name: string;
  reviewer_location?: string | null;
  quote: string;
  rating?: number | null;
  image_url?: string | null;
  image_public_id?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
}): AdminReviewRow {
  return {
    id: row.id,
    reviewerName: row.reviewer_name,
    reviewerLocation: row.reviewer_location ?? "",
    quote: row.quote,
    rating: Math.min(5, Math.max(1, row.rating ?? 5)),
    imageUrl: row.image_url ?? null,
    imagePublicId: row.image_public_id ?? null,
    sortOrder: row.sort_order ?? 0,
    isActive: row.is_active ?? true,
  };
}

function mapStorefront(row: AdminReviewRow): StorefrontReview {
  return {
    id: row.id,
    name: row.reviewerName,
    location: row.reviewerLocation,
    quote: row.quote,
    rating: row.rating,
    imageUrl: row.imageUrl || FALLBACK_IMAGE,
  };
}

export async function listAdminReviews(): Promise<AdminReviewRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, reviewer_name, reviewer_location, quote, rating, image_url, image_public_id, sort_order, is_active"
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAdminRow);
}

export async function listActiveStorefrontReviews(): Promise<StorefrontReview[]> {
  noStore();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, reviewer_name, reviewer_location, quote, rating, image_url, image_public_id, sort_order, is_active"
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("listActiveStorefrontReviews:", error.message);
    throw new Error(error.message);
  }

  return (data ?? []).map(mapAdminRow).map(mapStorefront);
}
