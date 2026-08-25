"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { AuthorizationError, requirePermission } from "@/server/rbac";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/server/audit";
import { deleteCloudinaryImage } from "@/lib/cloudinary";
import type { AdminReviewFormValues } from "@/types/admin-review";

const reviewSchema = z.object({
  reviewerName: z.string().min(1, "Name is required").max(120),
  reviewerLocation: z.string().min(1, "Location is required").max(120),
  quote: z.string().min(1, "Review text is required").max(2000),
  rating: z.coerce.number().int().min(1).max(5),
  imageUrl: z.string().max(2048).optional(),
  imagePublicId: z.string().max(512).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0),
  isActive: z.boolean(),
});

function revalidateReviews() {
  revalidatePath("/", "layout");
  revalidatePath("/");
}

export async function saveReviewAction(input: { id?: string; values: AdminReviewFormValues }) {
  try {
    const user = await requirePermission("catalog.write");
    const values = reviewSchema.parse({
      ...input.values,
      reviewerName: input.values.reviewerName.trim(),
      reviewerLocation: input.values.reviewerLocation.trim(),
      quote: input.values.quote.trim(),
      imageUrl: input.values.imageUrl?.trim() || undefined,
      imagePublicId: input.values.imagePublicId?.trim() || undefined,
    });

    const supabase = createSupabaseAdminClient();
    const payload = {
      reviewer_name: values.reviewerName,
      reviewer_location: values.reviewerLocation,
      quote: values.quote,
      rating: values.rating,
      image_url: values.imageUrl || null,
      image_public_id: values.imagePublicId || null,
      sort_order: values.sortOrder,
      is_active: values.isActive,
      updated_at: new Date().toISOString(),
    };

    if (input.id) {
      const { data: before } = await supabase.from("reviews").select("*").eq("id", input.id).maybeSingle();
      const { data, error } = await supabase
        .from("reviews")
        .update(payload)
        .eq("id", input.id)
        .select("id")
        .single();

      if (error || !data) {
        return { ok: false as const, error: error?.message ?? "Could not update review." };
      }

      await writeAuditLog({
        actorId: user.id,
        action: "review.updated",
        entityType: "Review",
        entityId: data.id,
        before,
        after: payload,
      });

      revalidateReviews();
      return { ok: true as const, id: data.id };
    }

    const { data, error } = await supabase.from("reviews").insert(payload).select("id").single();
    if (error || !data) {
      return { ok: false as const, error: error?.message ?? "Could not create review." };
    }

    await writeAuditLog({
      actorId: user.id,
      action: "review.created",
      entityType: "Review",
      entityId: data.id,
      after: payload,
    });

    revalidateReviews();
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

export async function removeReviewAction(input: { id: string }) {
  try {
    const user = await requirePermission("catalog.write");
    const supabase = createSupabaseAdminClient();
    const { data: existing } = await supabase.from("reviews").select("*").eq("id", input.id).maybeSingle();
    if (!existing) return { ok: false as const, error: "Review not found." };

    if (existing.image_public_id) {
      await deleteCloudinaryImage(existing.image_public_id).catch(() => undefined);
    }

    const { error } = await supabase.from("reviews").delete().eq("id", input.id);
    if (error) return { ok: false as const, error: error.message };

    await writeAuditLog({
      actorId: user.id,
      action: "review.deleted",
      entityType: "Review",
      entityId: input.id,
      before: existing,
    });

    revalidateReviews();
    return { ok: true as const };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false as const, error: error.message };
    }
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed." };
  }
}
