import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ShopStyle } from "@/lib/marketing";
import type { AdminShopStyleRow } from "@/types/admin-shop-style";

const FALLBACK_IMAGE = "/images/placeholders/1600566753190-17f0baa2a6c3.jpg";

function mapAdminRow(row: {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  href: string;
  image_url?: string | null;
  image_public_id?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
}): AdminShopStyleRow {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? "",
    href: row.href,
    imageUrl: row.image_url ?? null,
    imagePublicId: row.image_public_id ?? null,
    sortOrder: row.sort_order ?? 0,
    isActive: row.is_active ?? true,
  };
}

function mapStorefront(row: AdminShopStyleRow): ShopStyle {
  return {
    id: row.slug || row.id,
    title: row.title,
    subtitle: row.subtitle,
    image: row.imageUrl || FALLBACK_IMAGE,
    href: row.href,
  };
}

const SELECT_COLS =
  "id, slug, title, subtitle, href, image_url, image_public_id, sort_order, is_active";

export async function listAdminShopStyles(): Promise<AdminShopStyleRow[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("shop_styles")
    .select(SELECT_COLS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAdminRow);
}

/** Returns null when the table is missing so the homepage can fall back to hardcoded cards. */
export async function listActiveStorefrontShopStyles(): Promise<ShopStyle[] | null> {
  noStore();
  if (!isSupabaseConfigured()) return null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("shop_styles")
    .select(SELECT_COLS)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("listActiveStorefrontShopStyles:", error.message);
    return null;
  }

  return (data ?? []).map(mapAdminRow).map(mapStorefront);
}
