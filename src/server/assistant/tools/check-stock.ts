import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { formatMoney } from "@/lib/money";
import type { ToolContext, ToolResult } from "./types";

export async function runCheckStock(ctx: ToolContext): Promise<ToolResult | null> {
  const lower = ctx.message.toLowerCase();
  if (
    !lower.includes("stock") &&
    !lower.includes("available") &&
    !lower.includes("availability") &&
    !lower.includes("in stock")
  ) {
    return null;
  }

  if (!isSupabaseConfigured()) {
    return {
      tool: "check_stock",
      summary: "Inventory service unavailable.",
      data: { available: false },
    };
  }

  const supabase = createSupabaseAdminClient();
  const searchTerm = ctx.message
    .replace(/stock|available|availability|in stock/gi, "")
    .trim()
    .slice(0, 80);

  let query = supabase
    .from("products")
    .select(
      `
      id, name, slug, sale_price_minor,
      categories ( slug, name ),
      inventory ( stock_quantity, stock_status )
    `
    )
    .eq("status", "ACTIVE")
    .limit(5);

  if (searchTerm.length > 2) {
    query = query.ilike("name", `%${searchTerm}%`);
  }

  const { data, error } = await query;

  if (error || !data?.length) {
    return {
      tool: "check_stock",
      summary: "No matching products for stock lookup.",
      data: { products: [] },
    };
  }

  const products = data.map((row) => {
    const inv = Array.isArray(row.inventory) ? row.inventory[0] : row.inventory;
    const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
    return {
      name: row.name,
      slug: row.slug,
      category: category?.name,
      price: formatMoney(row.sale_price_minor),
      stockQuantity: inv?.stock_quantity ?? null,
      stockStatus: inv?.stock_status ?? "unknown",
    };
  });

  return {
    tool: "check_stock",
    summary: `Stock status for ${products.length} product(s).`,
    data: { products },
  };
}
