"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { AuthorizationError, requirePermission } from "@/server/rbac";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slug";
import { writeAuditLog } from "@/server/audit";
import { deleteCloudinaryImage } from "@/lib/cloudinary";
import type { AdminShopStyleFormValues } from "@/types/admin-shop-style";

const shopStyleSchema = z.object({
  title: z.string().min(1, "Title is required").max(80),
  subtitle: z.string().max(120),
  href: z
    .string()
    .min(1, "Link is required")
    .max(500)
    .refine((value) => value.startsWith("/") && !value.startsWith("//"), {
      message: "Link must be a site path like /shop?category=rugs",
    }),
  imageUrl: z.string().max(2048).optional(),
  imagePublicId: z.string().max(512).nullable().optional(),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

function revalidateShopStyles() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin/shop-styles");
}

async function uniqueStyleSlug(base: string, currentId?: string) {
  const supabase = createSupabaseAdminClient();
  const normalized = slugify(base) || `style-${Date.now()}`;
  let candidate = normalized;
  let counter = 2;

  while (true) {
    const { data } = await supabase.from("shop_styles").select("id").eq("slug", candidate).maybeSingle();
    if (!data || data.id === currentId) return candidate;
    candidate = `${normalized}-${counter}`;
    counter += 1;
  }
}

export async function saveShopStyleAction(input: { id?: string; values: AdminShopStyleFormValues }) {
  try {
    const user = await requirePermission("catalog.write");
    const values = shopStyleSchema.parse({
      ...input.values,
      title: input.values.title.trim(),
      subtitle: input.values.subtitle.trim(),
      href: input.values.href.trim(),
      imageUrl: input.values.imageUrl?.trim() || undefined,
      imagePublicId: input.values.imagePublicId?.trim() || undefined,
    });

    const supabase = createSupabaseAdminClient();
    const { data: before } = input.id
      ? await supabase.from("shop_styles").select("*").eq("id", input.id).maybeSingle()
      : { data: null };
    const slug = before?.slug ?? (await uniqueStyleSlug(values.title, input.id));
    const payload = {
      slug,
      title: values.title,
      subtitle: values.subtitle,
      href: values.href,
      image_url: values.imageUrl || null,
      image_public_id: values.imagePublicId || null,
      sort_order: values.sortOrder,
      is_active: values.isActive,
      updated_at: new Date().toISOString(),
    };

    if (input.id) {
      const { data, error } = await supabase
        .from("shop_styles")
        .update(payload)
        .eq("id", input.id)
        .select("id")
        .single();

      if (error || !data) {
        return { ok: false as const, error: error?.message ?? "Could not update style card." };
      }

      await writeAuditLog({
        actorId: user.id,
        action: "shop_style.updated",
        entityType: "ShopStyle",
        entityId: data.id,
        before,
        after: payload,
      });

      revalidateShopStyles();
      return { ok: true as const, id: data.id };
    }

    const { data, error } = await supabase.from("shop_styles").insert(payload).select("id").single();
    if (error || !data) {
      return { ok: false as const, error: error?.message ?? "Could not create style card." };
    }

    await writeAuditLog({
      actorId: user.id,
      action: "shop_style.created",
      entityType: "ShopStyle",
      entityId: data.id,
      after: payload,
    });

    revalidateShopStyles();
    return { ok: true as const, id: data.id };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false as const, error: error.message };
    }
    if (error instanceof z.ZodError) {
      return { ok: false as const, error: error.issues[0]?.message ?? "Invalid style card." };
    }
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed." };
  }
}

export async function removeShopStyleAction(input: { id: string }) {
  try {
    const user = await requirePermission("catalog.write");
    const supabase = createSupabaseAdminClient();
    const { data: existing } = await supabase.from("shop_styles").select("*").eq("id", input.id).maybeSingle();
    if (!existing) return { ok: false as const, error: "Style card not found." };

    if (existing.image_public_id) {
      await deleteCloudinaryImage(existing.image_public_id).catch(() => undefined);
    }

    const { error } = await supabase.from("shop_styles").delete().eq("id", input.id);
    if (error) return { ok: false as const, error: error.message };

    await writeAuditLog({
      actorId: user.id,
      action: "shop_style.deleted",
      entityType: "ShopStyle",
      entityId: input.id,
      before: existing,
    });

    revalidateShopStyles();
    return { ok: true as const };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false as const, error: error.message };
    }
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed." };
  }
}
