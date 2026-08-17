import { listProducts } from "@/server/catalog/products";
import { SUPABASE_CATALOG_SLUGS } from "@/lib/supabase/catalog-categories";
import { formatMoney } from "@/lib/money";
import type { ToolContext, ToolResult } from "./types";

function extractSearchTerms(message: string) {
  const lower = message.toLowerCase();
  const categoryHints: Record<string, string> = {
    curtain: "curtains",
    carpet: "carpets",
    rug: "carpets",
    "prayer mat": "prayer-mats",
    "prayer-mat": "prayer-mats",
  };

  let categorySlug: string | undefined;
  for (const [hint, slug] of Object.entries(categoryHints)) {
    if (lower.includes(hint)) {
      categorySlug = slug;
      break;
    }
  }

  const stopWords = new Set([
    "what", "which", "show", "find", "recommend", "best", "jalal", "product", "products",
    "price", "cost", "about", "have", "you", "your", "the", "for", "and", "with", "need",
  ]);

  const words = lower
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  const search = words.slice(0, 4).join(" ") || undefined;
  return { search, categorySlug };
}

export async function runSearchProducts(ctx: ToolContext): Promise<ToolResult | null> {
  const { search, categorySlug } = extractSearchTerms(ctx.message);
  const lower = ctx.message.toLowerCase();

  const wantsProducts =
    Boolean(search || categorySlug) ||
    /\b(recommend|show|find|browse|catalog|shop|product|curtain|carpet|rug|prayer)\b/i.test(lower);

  if (!wantsProducts) return null;

  const result = await listProducts({
    search,
    categorySlug,
    pageSize: 6,
    sort: "name",
  });

  const items = result.items.filter((p) =>
    (SUPABASE_CATALOG_SLUGS as readonly string[]).includes(p.category.slug)
  );

  if (items.length === 0) {
    return {
      tool: "search_products",
      summary: "No canonical catalog products matched the search.",
      data: { search, categorySlug, count: 0, products: [] },
    };
  }

  const products = items.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category.name,
    categorySlug: p.category.slug,
    shortDescription: p.shortDescription,
    price: formatMoney(p.salePriceMinor),
    priceMinor: p.salePriceMinor,
    url: `/products/${p.slug}`,
    inStock: p.stockStatus !== "out_of_stock",
  }));

  return {
    tool: "search_products",
    summary: `Found ${products.length} product(s)${search ? ` matching "${search}"` : ""}.`,
    data: { search, categorySlug, count: products.length, products },
  };
}
