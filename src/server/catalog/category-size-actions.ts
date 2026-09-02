"use server";

import { z } from "zod";
import { requireAnyPermission, AuthorizationError } from "@/server/rbac";
import {
  categoryHasSizes,
  getCategorySizesConfig,
  sanitizeCategorySizeInputs,
  syncCategorySizes,
} from "@/server/catalog/category-sizes";
import { CATEGORY_SIZES_MIGRATION_HINT } from "@/server/catalog/category-size-schema";
import type { AdminCategorySizeInput } from "@/types/category-sizes";

const sizeInputSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1, "Size name is required").max(120),
  sortOrder: z.coerce.number().int().min(0),
  isActive: z.boolean(),
  isCustom: z.boolean(),
});

export async function getCategorySizesAction(categoryId: string) {
  try {
    await requireAnyPermission("catalog.write", "category.write", "product.write");
    const config = await getCategorySizesConfig(categoryId);
    return {
      ok: true as const,
      sizes: config.sizes,
      sizesEnabled: config.sizesEnabled,
      resolvedCategoryId: config.resolvedCategoryId,
      schemaReady: config.schemaReady,
      migrationHint: config.schemaReady ? undefined : CATEGORY_SIZES_MIGRATION_HINT,
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false as const, error: error.message };
    }
    console.error("[getCategorySizesAction]", error);
    return { ok: false as const, error: "Could not load category sizes." };
  }
}

export async function saveCategorySizesAction(input: {
  categoryId: string;
  sizes: AdminCategorySizeInput[];
}) {
  try {
    await requireAnyPermission("catalog.write", "category.write");
    const parsed = z.array(sizeInputSchema).parse(input.sizes);
    const result = await syncCategorySizes(input.categoryId, parsed);
    if (!result.ok) return result;
    return { ok: true as const };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false as const, error: error.message };
    }
    if (error instanceof z.ZodError) {
      return { ok: false as const, error: error.issues[0]?.message ?? "Invalid size input." };
    }
    return { ok: false as const, error: "Could not save category sizes." };
  }
}

export async function categoryHasSizesAction(categoryId: string) {
  try {
    await requireAnyPermission("catalog.write", "category.write", "product.write");
    const hasSizes = await categoryHasSizes(categoryId);
    return { ok: true as const, hasSizes };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false as const, error: error.message };
    }
    return { ok: false as const, hasSizes: false };
  }
}
