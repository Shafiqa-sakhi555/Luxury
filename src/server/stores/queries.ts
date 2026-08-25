import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AdminStoreRow, StorefrontBranch } from "@/types/admin-store";

function mapAdminRow(row: {
  id: string;
  slug: string;
  name: string;
  city: string;
  region?: string | null;
  address: string;
  phone: string;
  description?: string | null;
  hours?: string | null;
  image_url?: string | null;
  image_public_id?: string | null;
  product_count?: number | null;
  sort_order?: number | null;
  is_active?: boolean | null;
}): AdminStoreRow {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city,
    region: row.region || row.city,
    address: row.address,
    phone: row.phone,
    description: row.description ?? null,
    hours: row.hours ?? null,
    imageUrl: row.image_url ?? null,
    imagePublicId: row.image_public_id ?? null,
    productCount: row.product_count ?? 0,
    sortOrder: row.sort_order ?? 0,
    isActive: row.is_active ?? true,
  };
}

function mapStorefront(row: AdminStoreRow): StorefrontBranch {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city,
    region: row.region,
    address: row.address,
    phone: row.phone,
    description: row.description,
    hours: row.hours,
    imageUrl: row.imageUrl || "/images/placeholders/1449824913935-59a10b8d2000.jpg",
    productCount: row.productCount,
  };
}

export async function listAdminStores(): Promise<AdminStoreRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("stores")
    .select(
      "id, slug, name, city, region, address, phone, description, hours, image_url, image_public_id, product_count, sort_order, is_active"
    )
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAdminRow);
}

export async function listActiveStorefrontBranches(): Promise<StorefrontBranch[]> {
  noStore();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("stores")
    .select(
      "id, slug, name, city, region, address, phone, description, hours, image_url, image_public_id, product_count, sort_order, is_active"
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("listActiveStorefrontBranches:", error.message);
    throw new Error(error.message);
  }

  return (data ?? []).map(mapAdminRow).map(mapStorefront);
}

export async function getStorefrontBranchBySlug(slug: string): Promise<StorefrontBranch | null> {
  noStore();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("stores")
    .select(
      "id, slug, name, city, region, address, phone, description, hours, image_url, image_public_id, product_count, sort_order, is_active"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapStorefront(mapAdminRow(data));
}
