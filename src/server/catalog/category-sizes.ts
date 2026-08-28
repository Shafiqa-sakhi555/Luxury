import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  CATEGORY_SIZES_MIGRATION_HINT,
  isCategorySizesSchemaReady,
  isMissingSchemaError,
} from "@/server/catalog/category-size-schema";
import type { AdminCategorySize, AdminCategorySizeInput } from "@/types/category-sizes";

type CategorySizeRow = {
  id: string;
  category_id: string;
  label: string;
  sort_order: number;
  is_active: boolean;
  is_custom: boolean;
};

function mapCategorySize(row: CategorySizeRow): AdminCategorySize {
  return {
    id: row.id,
    categoryId: row.category_id,
    label: row.label,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    isCustom: row.is_custom,
  };
}

export async function listCategorySizes(categoryId: string): Promise<AdminCategorySize[]> {
  if (!isSupabaseConfigured()) return [];
  if (!(await isCategorySizesSchemaReady())) return [];

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("category_sizes")
    .select("id, category_id, label, sort_order, is_active, is_custom")
    .eq("category_id", categoryId)
    .order("sort_order")
    .order("label");

  if (error || !data) return [];
  return data.map(mapCategorySize);
}

export async function getCategorySizesConfig(categoryId: string): Promise<{
  resolvedCategoryId: string;
  sizesEnabled: boolean;
  sizes: AdminCategorySize[];
  schemaReady: boolean;
}> {
  const fallback = {
    resolvedCategoryId: categoryId,
    sizesEnabled: false,
    sizes: [] as AdminCategorySize[],
    schemaReady: false,
  };

  if (!isSupabaseConfigured()) return fallback;

  const schemaReady = await isCategorySizesSchemaReady();
  if (!schemaReady) return { ...fallback, schemaReady: false };

  const supabase = createSupabaseAdminClient();
  const { data: category, error } = await supabase
    .from("categories")
    .select("id, parent_id, sizes_enabled")
    .eq("id", categoryId)
    .maybeSingle();

  if (error || !category) {
    return { ...fallback, schemaReady: true };
  }

  if (category.sizes_enabled) {
    const sizes = await listCategorySizes(category.id);
    return { resolvedCategoryId: category.id, sizesEnabled: true, sizes, schemaReady: true };
  }

  if (category.parent_id) {
    const { data: parent } = await supabase
      .from("categories")
      .select("id, sizes_enabled")
      .eq("id", category.parent_id)
      .maybeSingle();

    if (parent?.sizes_enabled) {
      const sizes = await listCategorySizes(parent.id);
      return { resolvedCategoryId: parent.id, sizesEnabled: true, sizes, schemaReady: true };
    }
  }

  return {
    resolvedCategoryId: category.id,
    sizesEnabled: false,
    sizes: [],
    schemaReady: true,
  };
}

export async function resolveCategorySizesCategoryId(categoryId: string): Promise<string> {
  const config = await getCategorySizesConfig(categoryId);
  return config.resolvedCategoryId;
}

export async function categoryHasSizes(categoryId: string): Promise<boolean> {
  const config = await getCategorySizesConfig(categoryId);
  return config.schemaReady && config.sizesEnabled && config.sizes.some((size) => size.isActive);
}

export async function syncCategorySizes(
  categoryId: string,
  sizes: AdminCategorySizeInput[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await isCategorySizesSchemaReady())) {
    return { ok: false, error: CATEGORY_SIZES_MIGRATION_HINT };
  }

  const supabase = createSupabaseAdminClient();

  const normalized = sizes
    .map((size, index) => ({
      id: size.id,
      label: size.label.trim(),
      sort_order: size.sortOrder ?? index,
      is_active: size.isActive,
      is_custom: size.isCustom,
    }))
    .filter((size) => size.label.length > 0);

  const labels = normalized.map((size) => size.label.toLowerCase());
  if (new Set(labels).size !== labels.length) {
    return { ok: false, error: "Size labels must be unique within a category." };
  }

  const { data: existingRows, error: loadError } = await supabase
    .from("category_sizes")
    .select("id")
    .eq("category_id", categoryId);

  if (loadError) {
    return {
      ok: false,
      error: isMissingSchemaError(loadError.message)
        ? CATEGORY_SIZES_MIGRATION_HINT
        : loadError.message,
    };
  }

  const incomingIds = new Set(normalized.filter((size) => size.id).map((size) => size.id!));
  const toDelete = (existingRows ?? [])
    .map((row) => row.id)
    .filter((id) => !incomingIds.has(id));

  for (const id of toDelete) {
    const { count } = await supabase
      .from("product_variants")
      .select("id", { count: "exact", head: true })
      .eq("category_size_id", id);

    if ((count ?? 0) > 0) {
      return {
        ok: false,
        error: "Cannot delete a size that is used by product variants. Disable it instead.",
      };
    }
  }

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase.from("category_sizes").delete().in("id", toDelete);
    if (deleteError) return { ok: false, error: deleteError.message };
  }

  for (const size of normalized) {
    const payload = {
      category_id: categoryId,
      label: size.label,
      sort_order: size.sort_order,
      is_active: size.is_active,
      is_custom: size.is_custom,
    };

    if (size.id) {
      const { error } = await supabase.from("category_sizes").update(payload).eq("id", size.id);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await supabase.from("category_sizes").insert(payload);
      if (error) return { ok: false, error: error.message };
    }
  }

  return { ok: true };
}

export function sanitizeCategorySizeInputs(
  sizes: AdminCategorySizeInput[] | undefined
): AdminCategorySizeInput[] {
  if (!sizes?.length) return [];
  return sizes
    .filter((size) => size.label.trim().length > 0)
    .map((size, index) => ({
      ...size,
      label: size.label.trim(),
      sortOrder: index,
    }));
}
