"use server";

import { z } from "zod";
import type { AdminCategoryFormValues } from "@/types/admin-category";
import {
  createPrismaCategory,
  deletePrismaCategory,
  updatePrismaCategory,
} from "@/server/catalog/admin-category-mutations";
import { AuthorizationError } from "@/server/rbac";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  slug: z.string().max(120).optional(),
  description: z.string().max(5000).optional(),
  heroImage: z.string().max(2048).optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).max(9999),
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
    const values = parseCategoryValues(input.values);
    if (input.id) return updatePrismaCategory(input.id, values);
    return createPrismaCategory(values);
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
    return deletePrismaCategory(input.id);
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
