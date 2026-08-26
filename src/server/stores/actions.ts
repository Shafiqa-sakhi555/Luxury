"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { AuthorizationError, requirePermission } from "@/server/rbac";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slug";
import { writeAuditLog } from "@/server/audit";
import { deleteCloudinaryImage } from "@/lib/cloudinary";
import type { AdminStoreFormValues } from "@/types/admin-store";

const storeSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  slug: z.string().max(120).optional(),
  city: z.string().min(1, "City is required").max(120),
  region: z.string().min(1, "Region is required").max(120),
  address: z.string().min(1, "Location is required").max(500),
  phone: z.string().max(40).optional(),
  description: z.string().max(5000).optional(),
  hours: z.string().max(200).optional(),
  imageUrl: z.string().max(2048).optional(),
  imagePublicId: z.string().max(512).nullable().optional(),
  productCount: z.coerce.number().int().min(0),
  sortOrder: z.coerce.number().int().min(0),
  isActive: z.boolean(),
});

function revalidateBranches(slug?: string) {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/stores");
  revalidatePath("/stores", "layout");
  if (slug) revalidatePath(`/stores/${slug}`);
}

async function uniqueStoreSlug(base: string, currentId?: string) {
  const supabase = createSupabaseAdminClient();
    const normalized = slugify(base) || `branch-${Date.now()}`;
    let candidate = normalized;
    let counter = 2;

    while (true) {
      const { data } = await supabase.from("stores").select("id").eq("slug", candidate).maybeSingle();
    if (!data || data.id === currentId) return candidate;
    candidate = `${normalized}-${counter}`;
    counter += 1;
  }
}

export async function saveStoreAction(input: { id?: string; values: AdminStoreFormValues }) {
  try {
    const user = await requirePermission("catalog.write");
    const values = storeSchema.parse({
      ...input.values,
      slug: input.values.slug?.trim() || undefined,
      description: input.values.description?.trim() || undefined,
      hours: input.values.hours?.trim() || undefined,
      imageUrl: input.values.imageUrl?.trim() || undefined,
      imagePublicId: input.values.imagePublicId?.trim() || undefined,
      phone: input.values.phone?.trim() || "",
    });

    const supabase = createSupabaseAdminClient();
    const slug = await uniqueStoreSlug(values.slug || values.name, input.id);

    const payload = {
      name: values.name.trim(),
      slug,
      city: values.city.trim(),
      region: values.region.trim(),
      address: values.address.trim(),
      phone: values.phone?.trim() || "—",
      description: values.description?.trim() || null,
      hours: values.hours?.trim() || null,
      image_url: values.imageUrl || null,
      image_public_id: values.imagePublicId || null,
      product_count: values.productCount,
      sort_order: values.sortOrder,
      is_active: values.isActive,
      updated_at: new Date().toISOString(),
    };

    if (input.id) {
      const { data: before } = await supabase.from("stores").select("*").eq("id", input.id).maybeSingle();
      const { data, error } = await supabase
        .from("stores")
        .update(payload)
        .eq("id", input.id)
        .select("id, slug")
        .single();

      if (error || !data) {
        return { ok: false as const, error: error?.message ?? "Could not update branch." };
      }

      await writeAuditLog({
        actorId: user.id,
        action: "store.updated",
        entityType: "Store",
        entityId: data.id,
        before,
        after: payload,
      });

      revalidateBranches(data.slug);
      if (before?.slug && before.slug !== data.slug) {
        revalidatePath(`/stores/${before.slug}`);
      }

      return { ok: true as const, id: data.id };
    }

    const { data, error } = await supabase.from("stores").insert(payload).select("id, slug").single();
    if (error || !data) {
      return { ok: false as const, error: error?.message ?? "Could not create branch." };
    }

    await writeAuditLog({
      actorId: user.id,
      action: "store.created",
      entityType: "Store",
      entityId: data.id,
      after: payload,
    });

    revalidateBranches(data.slug);
    return { ok: true as const, id: data.id };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false as const, error: error.message };
    }
    if (error instanceof z.ZodError) {
      return { ok: false as const, error: error.issues[0]?.message ?? "Invalid branch details." };
    }
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed." };
  }
}

export async function removeStoreAction(input: { id: string }) {
  try {
    const user = await requirePermission("catalog.write");
    const supabase = createSupabaseAdminClient();
    const { data: existing } = await supabase.from("stores").select("*").eq("id", input.id).maybeSingle();
    if (!existing) return { ok: false as const, error: "Branch not found." };

    const { count } = await supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("preferred_store_id", input.id);

    if ((count ?? 0) > 0) {
      await supabase.from("stores").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", input.id);
      await writeAuditLog({
        actorId: user.id,
        action: "store.archived",
        entityType: "Store",
        entityId: input.id,
        before: existing,
      });
      revalidateBranches(existing.slug);
      return { ok: true as const, archived: true };
    }

    if (existing.image_public_id) {
      await deleteCloudinaryImage(existing.image_public_id).catch(() => undefined);
    }

    const { error } = await supabase.from("stores").delete().eq("id", input.id);
    if (error) return { ok: false as const, error: error.message };

    await writeAuditLog({
      actorId: user.id,
      action: "store.deleted",
      entityType: "Store",
      entityId: input.id,
      before: existing,
    });

    revalidateBranches(existing.slug);
    return { ok: true as const, archived: false };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false as const, error: error.message };
    }
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed." };
  }
}
