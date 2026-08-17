import { getProductBySlug } from "@/server/catalog/products";
import { formatMoney } from "@/lib/money";
import type { ToolContext, ToolResult } from "./types";

function extractSlug(message: string) {
  const match = message.match(/\/products\/([a-z0-9-]+)/i);
  if (match) return match[1];

  const slugMatch = message.match(/\b([a-z0-9]+(?:-[a-z0-9]+)+)\b/i);
  return slugMatch?.[1];
}

export async function runGetProduct(ctx: ToolContext): Promise<ToolResult | null> {
  const slug = ctx.slug ?? extractSlug(ctx.message);
  if (!slug) return null;

  const lower = ctx.message.toLowerCase();
  const wantsDetail =
    lower.includes("detail") ||
    lower.includes("spec") ||
    lower.includes("tell me about") ||
    lower.includes("more about") ||
    Boolean(ctx.slug);

  if (!wantsDetail && !ctx.slug) return null;

  const product = await getProductBySlug(slug);
  if (!product) {
    return {
      tool: "get_product",
      summary: `No product found for slug "${slug}".`,
      data: { slug, found: false },
    };
  }

  const variants = (product.variants ?? []).map((v) => ({
    sku: v.sku,
    name: v.name,
    color: v.color,
    design: v.design,
    size: v.size,
    price: formatMoney(v.salePriceMinor),
    stockStatus: v.stockStatus,
    stockQuantity: v.stockQuantity,
  }));

  return {
    tool: "get_product",
    summary: `Loaded product "${product.name}".`,
    data: {
      found: true,
      id: product.id,
      name: product.name,
      slug: product.slug,
      category: product.category.name,
      shortDescription: product.shortDescription,
      description: product.description?.slice(0, 600),
      size: product.size,
      fabric: product.fabric,
      design: product.design,
      price: formatMoney(product.salePriceMinor),
      priceMinor: product.salePriceMinor,
      stockStatus: product.stockStatus,
      stockQuantity: product.stockQuantity,
      url: `/products/${product.slug}`,
      variants,
    },
  };
}
