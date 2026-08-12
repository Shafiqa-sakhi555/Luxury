import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { requirePermission } from "@/server/rbac";
import { writeAuditLog } from "@/server/audit";
import { uniqueProductSlug } from "@/lib/slug";
import type { AdminCategoryFormValues } from "@/types/admin-category";
import type { MutationResult } from "@/server/catalog/admin-mutations";

async function uniqueCategorySlug(
  base: string,
  currentSlug?: string
): Promise<string> {
  return uniqueProductSlug(base, async (candidate) => {
    const existing = await db.category.findUnique({ where: { slug: candidate } });
    return Boolean(existing && existing.slug !== currentSlug);
  }, currentSlug);
}

async function validateParent(parentId: string | null | undefined, categoryId?: string) {
  if (!parentId) return null;

  if (categoryId && parentId === categoryId) {
    return "A category cannot be its own parent.";
  }

  const parent = await db.category.findUnique({ where: { id: parentId } });
  if (!parent) return "Parent category not found.";

  if (parent.parentId) {
    return "Only top-level categories can be selected as a parent.";
  }

  if (categoryId) {
    const descendants = await db.category.findMany({
      where: { parentId: categoryId },
      select: { id: true },
    });
    if (descendants.some((c) => c.id === parentId)) {
      return "A category cannot be moved under one of its own subcategories.";
    }
  }

  return null;
}

export async function createPrismaCategory(
  input: AdminCategoryFormValues
): Promise<MutationResult> {
  const session = await requirePermission("category.write");

  const parentError = await validateParent(input.parentId ?? null);
  if (parentError) return { ok: false, error: parentError };

  const slug = await uniqueCategorySlug(input.slug?.trim() || input.name);

  const category = await db.category.create({
    data: {
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      heroImage: input.heroImage?.trim() || null,
      parentId: input.parentId || null,
      sortOrder: input.sortOrder ?? 0,
      status: input.status,
    },
  });

  await writeAuditLog({
    actorId: session.user.id,
    action: "category.create",
    entityType: "Category",
    entityId: category.id,
    after: { name: category.name, slug: category.slug },
  });

  revalidatePath("/admin/catalog/categories");
  revalidatePath("/shop");

  return { ok: true, id: category.id };
}

export async function updatePrismaCategory(
  id: string,
  input: AdminCategoryFormValues
): Promise<MutationResult> {
  const session = await requirePermission("category.write");

  const existing = await db.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true, children: true } } },
  });
  if (!existing) return { ok: false, error: "Category not found." };

  const parentError = await validateParent(input.parentId ?? null, id);
  if (parentError) return { ok: false, error: parentError };

  if (input.parentId && existing._count.children > 0) {
    return {
      ok: false,
      error: "Remove or reassign subcategories before making this a child category.",
    };
  }

  const slug = await uniqueCategorySlug(
    input.slug?.trim() || input.name,
    existing.slug
  );

  const category = await db.category.update({
    where: { id },
    data: {
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      heroImage: input.heroImage?.trim() || null,
      parentId: input.parentId || null,
      sortOrder: input.sortOrder ?? 0,
      status: input.status,
    },
  });

  await writeAuditLog({
    actorId: session.user.id,
    action: "category.update",
    entityType: "Category",
    entityId: category.id,
    before: { name: existing.name, slug: existing.slug, status: existing.status },
    after: { name: category.name, slug: category.slug, status: category.status },
  });

  revalidatePath("/admin/catalog/categories");
  revalidatePath("/shop");
  revalidatePath(`/categories/${category.slug}`);

  return { ok: true, id: category.id };
}

export async function deletePrismaCategory(id: string): Promise<MutationResult> {
  const session = await requirePermission("category.write");

  const category = await db.category.findUnique({
    where: { id },
    include: {
      _count: { select: { products: true, children: true } },
    },
  });
  if (!category) return { ok: false, error: "Category not found." };

  if (category._count.children > 0) {
    return {
      ok: false,
      error: "Delete subcategories first, or reassign them to another parent.",
    };
  }

  if (category._count.products > 0) {
    await db.category.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });

    await writeAuditLog({
      actorId: session.user.id,
      action: "category.archive",
      entityType: "Category",
      entityId: category.id,
      reason: "Category has products; archived instead of deleted.",
      before: { name: category.name, status: category.status },
      after: { status: "ARCHIVED" },
    });

    revalidatePath("/admin/catalog/categories");
    revalidatePath("/shop");

    return {
      ok: false,
      error: `"${category.name}" has ${category._count.products} product(s) and was archived instead of deleted.`,
    };
  }

  await db.category.delete({ where: { id } });

  await writeAuditLog({
    actorId: session.user.id,
    action: "category.delete",
    entityType: "Category",
    entityId: category.id,
    before: { name: category.name, slug: category.slug },
  });

  revalidatePath("/admin/catalog/categories");
  revalidatePath("/shop");

  return { ok: true, id: category.id };
}
