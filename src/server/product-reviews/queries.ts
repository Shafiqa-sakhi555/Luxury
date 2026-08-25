import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  AdminProductReviewRow,
  ProductReview,
  ProductReviewProductOption,
} from "@/types/product-review";

type ReviewRow = {
  id: string;
  product_id: string;
  reviewer_name: string;
  review_title?: string | null;
  review_body: string;
  rating?: number | null;
  image_url?: string | null;
  image_public_id?: string | null;
  is_verified?: boolean | null;
  is_published?: boolean | null;
  created_at: string;
  products?: { name?: string | null; slug?: string | null } | { name?: string | null; slug?: string | null }[] | null;
};

function productFromJoin(row: ReviewRow) {
  const related = Array.isArray(row.products) ? row.products[0] : row.products;
  return {
    name: related?.name ?? "Product",
    slug: related?.slug ?? "",
  };
}

function mapStorefront(row: ReviewRow): ProductReview {
  return {
    id: row.id,
    productId: row.product_id,
    reviewerName: row.reviewer_name,
    title: row.review_title ?? "",
    body: row.review_body,
    rating: Math.min(5, Math.max(1, row.rating ?? 5)),
    imageUrl: row.image_url ?? null,
    isVerified: row.is_verified ?? false,
    createdAt: row.created_at,
  };
}

function mapAdmin(row: ReviewRow): AdminProductReviewRow {
  const product = productFromJoin(row);
  return {
    ...mapStorefront(row),
    productName: product.name,
    productSlug: product.slug,
    imagePublicId: row.image_public_id ?? null,
    isPublished: row.is_published ?? true,
  };
}

export async function listPublishedProductReviews(productId: string): Promise<ProductReview[]> {
  noStore();
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("product_reviews")
      .select(
        "id, product_id, reviewer_name, review_title, review_body, rating, image_url, is_verified, created_at"
      )
      .eq("product_id", productId)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("listPublishedProductReviews:", error.message);
      return [];
    }

    return (data ?? []).map(mapStorefront);
  } catch (error) {
    console.error("listPublishedProductReviews:", error);
    return [];
  }
}

export async function listAdminProductReviews(): Promise<AdminProductReviewRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("product_reviews")
    .select(
      "id, product_id, reviewer_name, review_title, review_body, rating, image_url, image_public_id, is_verified, is_published, created_at, products(name, slug)"
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAdmin);
}

export async function listProductReviewProductOptions(): Promise<ProductReviewProductOption[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug")
    .neq("status", "ARCHIVED")
    .order("name", { ascending: true });

  if (error) {
    const fallback = await supabase.from("products").select("id, name, slug").order("name", { ascending: true });
    if (fallback.error) throw new Error(fallback.error.message);
    return fallback.data ?? [];
  }

  return data ?? [];
}
