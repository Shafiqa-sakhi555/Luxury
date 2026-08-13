"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { AdminCategoryFormValues } from "@/types/admin-category";
import { AuthorizationError, requirePermission } from "@/server/rbac";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slug";
import { writeAuditLog } from "@/server/audit";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  slug: z.string().max(120).optional(),
  description: z.string().max(5000).optional(),
  heroImage: z.string().max(2048).optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.coerce.number().int().min(0),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]),
});

function parseCategoryValues(values: AdminCategoryFormValues) {
  return categorySchema.parse({
    ...values,
    parentId: values.parentId || null,
    slug: values.slug?.trim() || undefined,
    description: values.description?.trim() || undefined,
    heroImage: values.heroImage?.trim() || undefined,
  });
}

export async function saveCategoryAction(input: {
  id?: string;
  values: AdminCategoryFormValues;
}) {
  try {
    const user = await requirePermission("catalog.write");
    const values = parseCategoryValues(input.values);
    const supabase = createSupabaseAdminClient();

    let slug = values.slug;
    if (!slug) {
      slug = slugify(values.name);
    }
    
    // Ensure unique slug
    const { data: existingSlugs } = await supabase.from("categories").select("slug").neq("id", input.id || "00000000-0000-0000-0000-000000000000");
    const takenSlugs = new Set(existingSlugs?.map((s) => s.slug) ?? []);
    
    let finalSlug = slug;
    let counter = 1;
    while (takenSlugs.has(finalSlug)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const payload = {
      name: values.name,
      slug: finalSlug,
      description: values.description || null,
      image_url: values.heroImage || null,
      parent_id: values.parentId || null,
      sort_order: values.sortOrder,
      is_active: values.status === "ACTIVE",
    };

    if (input.id) {
      const { error } = await supabase.from("categories").update(payload).eq("id", input.id);
      if (error) throw new Error(error.message);
      
      await writeAuditLog({
        actorId: user.id,
        action: "category.update",
        entityType: "SupabaseCategory",
        entityId: input.id,
        after: payload,
      });
    } else {
      const { data, error } = await supabase.from("categories").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      
      await writeAuditLog({
        actorId: user.id,
        action: "category.create",
        entityType: "SupabaseCategory",
        entityId: data.id,
        after: payload,
      });
    }

    revalidatePath("/admin/catalog/categories");
    revalidatePath("/shop");
    
    return { ok: true as const };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false as const, error: error.message };
    }
    if (error instanceof z.ZodError) {
      return { ok: false as const, error: error.issues[0]?.message ?? "Invalid input." };
    }
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Could not save category.",
    };
  }
}

export async function removeCategoryAction(input: { id: string }) {
  try {
    const user = await requirePermission("catalog.delete");
    const supabase = createSupabaseAdminClient();
    
    const { error } = await supabase.from("categories").delete().eq("id", input.id);
    if (error) throw new Error(error.message);

    await writeAuditLog({
      actorId: user.id,
      action: "category.delete",
      entityType: "SupabaseCategory",
      entityId: input.id,
    });

    revalidatePath("/admin/catalog/categories");
    revalidatePath("/shop");

    return { ok: true as const };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false as const, error: error.message };
    }
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Could not delete category.",
    };
  }
}
