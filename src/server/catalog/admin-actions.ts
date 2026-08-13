"use server";

import type { AdminProductFormValues } from "@/types/admin-catalog";
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

  if (id) return updateSupabaseCatalogProduct(id, values);
  return createSupabaseCatalogProduct(values);
}

export async function removeProductAction(input: { id: string }) {
  return deleteSupabaseCatalogProduct(input.id);
}

export async function archiveProductAction(input: { id: string }) {
  return archiveSupabaseCatalogProduct(input.id);
}
