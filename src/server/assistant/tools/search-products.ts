import { listProducts } from "@/server/catalog/products";
import { formatMoney } from "@/lib/money";
import type { ToolContext, ToolResult } from "./types";

const CATEGORY_HINTS: Array<{ hint: string; slug: string }> = [
  { hint: "curtain", slug: "curtains" },
  { hint: "carpet", slug: "carpets" },
  { hint: "rug", slug: "rugs" },
  { hint: "prayer mat", slug: "prayer-mats" },
  { hint: "janamaz", slug: "prayer-mats" },
  { hint: "furniture", slug: "furniture" },
  { hint: "dining set", slug: "furniture" },
  { hint: "dining table", slug: "table" },
  { hint: "table", slug: "table" },
  { hint: "sofa", slug: "sofa" },
  { hint: "chair", slug: "chair" },
  { hint: "bed", slug: "beds" },
  { hint: "cupboard", slug: "cupboard" },
  { hint: "wardrobe", slug: "cupboard" },
  { hint: "flooring", slug: "flooring" },
  { hint: "cushion", slug: "cushions" },
  { hint: "curtain", slug: "curtains" },
  { hint: "decor", slug: "decor" },
  { hint: "blanket", slug: "blankets" },
  { hint: "towel", slug: "towels" },
  { hint: "bedsheet", slug: "bedsheets" },
  { hint: "pillow", slug: "pillows" },
];

function extractSearchTerms(message: string) {
  const lower = message.toLowerCase();

  let categorySlug: string | undefined;
  for (const { hint, slug } of CATEGORY_HINTS) {
    if (lower.includes(hint)) {
      categorySlug = slug;
      break;
    }
  }

  const stopWords = new Set([
    "what",
    "which",
    "show",
    "find",
    "recommend",
    "best",
    "jalal",
    "product",
    "products",
    "price",
    "cost",
    "about",
    "have",
    "you",
    "your",
    "the",
    "for",
    "and",
    "with",
    "need",
    "please",
    "want",
    "looking",
    "some",
    "any",
    "options",
    "available",
  ]);

  const words = lower
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  const search = words.slice(0, 5).join(" ") || undefined;
  return { search, categorySlug };
}

export async function runSearchProducts(ctx: ToolContext): Promise<ToolResult | null> {
  const { search, categorySlug } = extractSearchTerms(ctx.message);
  const lower = ctx.message.toLowerCase();

  const wantsProducts =
    Boolean(categorySlug) ||
    /\b(recommend|show me|find me|browse|catalog|shop|product|curtain|carpet|rug|prayer|furniture|sofa|table|dining|bed|flooring|blanket|towel|pillow|cushion)\b/i.test(
      lower
    );

  if (!wantsProducts) return null;

  const result = await listProducts({
    search,
    categorySlug,
    pageSize: 6,
    sort: "name",
  });

  const items = result.items;

  if (items.length === 0) {
    return {
      tool: "search_products",
      summary: "No catalog products matched the search.",
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
    imageUrl: p.images.find((img) => img.isPrimary)?.url ?? p.images[0]?.url ?? null,
    inStock: p.stockStatus !== "out_of_stock",
  }));

  return {
    tool: "search_products",
    summary: `Found ${products.length} product(s)${search ? ` matching "${search}"` : ""}.`,
    data: { search, categorySlug, count: products.length, products },
  };
}
