"use server";

import type { AdminProductFormValues, CatalogSource } from "@/types/admin-catalog";
import {
  archivePrismaProduct,
  createPrismaProduct,
  deletePrismaProduct,
  updatePrismaProduct,
} from "@/server/catalog/admin-mutations";
import {
  archiveSupabaseCatalogProduct,
  createSupabaseCatalogProduct,
  deleteSupabaseCatalogProduct,
  updateSupabaseCatalogProduct,
} from "@/server/catalog/admin-supabase-mutations";

export async function saveProductAction(input: {
  id?: string;
  values: AdminProductFormValues;
}) {
  const { id, values } = input;

  if (values.source === "supabase") {
    if (id) return updateSupabaseCatalogProduct(id, values);
    return createSupabaseCatalogProduct(values);
  }

  if (id) return updatePrismaProduct(id, values);
  return createPrismaProduct(values);
}

export async function removeProductAction(input: { id: string; source: CatalogSource }) {
  if (input.source === "supabase") {
    return deleteSupabaseCatalogProduct(input.id);
  }
  return deletePrismaProduct(input.id);
}

export async function archiveProductAction(input: { id: string; source: CatalogSource }) {
  if (input.source === "supabase") {
    return archiveSupabaseCatalogProduct(input.id);
  }
  return archivePrismaProduct(input.id);
}
