"use server";

import { randomUUID } from "crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { AuthorizationError, requirePermission } from "@/server/rbac";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/server/audit";
import { deleteCloudinaryImage, uploadImageBuffer } from "@/lib/cloudinary";
import { isCloudinaryConfigured } from "@/lib/cloudinary/env";
import { buildBannerPublicId } from "@/lib/cloudinary/paths";
import type { AdminProductReviewFormValues } from "@/types/product-review";

const customerSchema = z.object({
  productId: z.string().uuid(),
  productSlug: z.string().min(1).max(200),
  reviewerName: z.string().min(1, "Name is required").max(80),
  title: z.string().max(120).optional(),
  body: z.string().min(8, "Please write a bit more about the product.").max(2000),
  rating: z.coerce.number().int().min(1).max(5),
});

const adminSchema = z.object({
  productId: z.string().uuid("Select a product"),
  reviewerName: z.string().min(1, "Name is required").max(80),
  title: z.string().max(120).optional(),
  body: z.string().min(1, "Review text is required").max(2000),
  rating: z.coerce.number().int().min(1).max(5),
  imageUrl: z.string().max(2048).optional(),
  imagePublicId: z.string().max(512).nullable().optional(),
  isVerified: z.boolean(),
  isPublished: z.boolean(),
});

function revalidateProduct(slug: string) {
  revalidatePath(`/products/${slug}`);
  revalidatePath("/admin/reviews");
}

async function productSlugById(productId: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("products").select("slug").eq("id", productId).maybeSingle();
  return data?.slug ?? "";
}

async function uploadOptionalReviewImage(file: File | null) {
  if (!file || file.size === 0) return { imageUrl: null as string | null, imagePublicId: null as string | null };
  if (!isCloudinaryConfigured()) {
    throw new Error("Photo upload is not configured.");
  }
  if (file.size > 4 * 1024 * 1024) {
    throw new Error("Photo must be under 4 MB.");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadImageBuffer(buffer, {
    mimeType: file.type || "image/jpeg",
    publicId: buildBannerPublicId(`product-review-${randomUUID()}`),
    overwrite: false,
  });

  return { imageUrl: uploaded.secureUrl, imagePublicId: uploaded.publicId };
}

export async function submitProductReviewAction(formData: FormData) {
  try {
    const values = customerSchema.parse({
      productId: String(formData.get("productId") ?? ""),
      productSlug: String(formData.get("productSlug") ?? ""),
      reviewerName: String(formData.get("reviewerName") ?? "").trim(),
      title: String(formData.get("title") ?? "").trim() || undefined,
      body: String(formData.get("body") ?? "").trim(),
      rating: formData.get("rating"),
    });

    const photo = formData.get("photo");
    const file = photo instanceof File ? photo : null;
    const image = await uploadOptionalReviewImage(file);

    const supabase = createSupabaseAdminClient();
    const { data: product } = await supabase
      .from("products")
      .select("id, slug")
      .eq("id", values.productId)
      .maybeSingle();

    if (!product) {
      return { ok: false as const, error: "Product not found." };
    }

    const { error } = await supabase.from("product_reviews").insert({
      product_id: values.productId,
      reviewer_name: values.reviewerName,
      review_title: values.title ?? "",
      review_body: values.body,
      rating: values.rating,
      image_url: image.imageUrl,
      image_public_id: image.imagePublicId,
      is_verified: false,
      is_published: true,
    });

    if (error) {
      return { ok: false as const, error: error.message };
    }

    revalidateProduct(product.slug || values.productSlug);
    return { ok: true as const };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false as const, error: error.issues[0]?.message ?? "Please check your review." };
    }
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not submit review." };
  }
}

export async function saveProductReviewAction(input: {
  id?: string;
  values: AdminProductReviewFormValues;
}) {
  try {
    const user = await requirePermission("catalog.write");
    const values = adminSchema.parse({
      ...input.values,
      reviewerName: input.values.reviewerName.trim(),
      title: input.values.title?.trim() || undefined,
      body: input.values.body.trim(),
      imageUrl: input.values.imageUrl?.trim() || undefined,
      imagePublicId: input.values.imagePublicId?.trim() || undefined,
    });

    const supabase = createSupabaseAdminClient();
    const payload = {
      product_id: values.productId,
      reviewer_name: values.reviewerName,
      review_title: values.title ?? "",
      review_body: values.body,
      rating: values.rating,
      image_url: values.imageUrl || null,
      image_public_id: values.imagePublicId || null,
      is_verified: values.isVerified,
      is_published: values.isPublished,
      updated_at: new Date().toISOString(),
    };

    if (input.id) {
      const { data: before } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("id", input.id)
        .maybeSingle();
      const { data, error } = await supabase
        .from("product_reviews")
        .update(payload)
        .eq("id", input.id)
        .select("id")
        .single();

      if (error || !data) {
        return { ok: false as const, error: error?.message ?? "Could not update review." };
      }

      await writeAuditLog({
        actorId: user.id,
        action: "product_review.updated",
        entityType: "ProductReview",
        entityId: data.id,
        before,
        after: payload,
      });

      revalidateProduct((await productSlugById(values.productId)) || "");
      return { ok: true as const, id: data.id };
    }

    const { data, error } = await supabase.from("product_reviews").insert(payload).select("id").single();
    if (error || !data) {
      return { ok: false as const, error: error?.message ?? "Could not create review." };
    }

    await writeAuditLog({
      actorId: user.id,
      action: "product_review.created",
      entityType: "ProductReview",
      entityId: data.id,
      after: payload,
    });

    revalidateProduct((await productSlugById(values.productId)) || "");
    return { ok: true as const, id: data.id };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false as const, error: error.message };
    }
    if (error instanceof z.ZodError) {
      return { ok: false as const, error: error.issues[0]?.message ?? "Invalid review." };
    }
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed." };
  }
}

export async function removeProductReviewAction(input: { id: string }) {
  try {
    const user = await requirePermission("catalog.write");
    const supabase = createSupabaseAdminClient();
    const { data: existing } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("id", input.id)
      .maybeSingle();
    if (!existing) return { ok: false as const, error: "Review not found." };

    if (existing.image_public_id) {
      await deleteCloudinaryImage(existing.image_public_id).catch(() => undefined);
    }

    const { error } = await supabase.from("product_reviews").delete().eq("id", input.id);
    if (error) return { ok: false as const, error: error.message };

    await writeAuditLog({
      actorId: user.id,
      action: "product_review.deleted",
      entityType: "ProductReview",
      entityId: input.id,
      before: existing,
    });

    const slug = await productSlugById(existing.product_id);
    revalidateProduct(slug);
    return { ok: true as const };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false as const, error: error.message };
    }
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed." };
  }
}
