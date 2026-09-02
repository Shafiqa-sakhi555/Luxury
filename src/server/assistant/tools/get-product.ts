import { getProductBySlug, listProducts } from "@/server/catalog/products";
import { formatMoney } from "@/lib/money";
import type { ToolContext, ToolResult } from "./types";

function extractSlug(message: string) {
  const match = message.match(/\/products\/([a-z0-9-]+)/i);
  if (match) return match[1];
  return null;
}

function extractProductName(message: string) {
  const patterns = [
    /(?:tell me more about|more about|details (?:on|for)|about)\s+(.+)$/i,
    /(?:what(?:'s| is) the (?:price|stock) (?:of|for))\s+(.+)$/i,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) {
      return match[1].replace(/[?.!]+$/, "").trim();
    }
  }
  return null;
}

function mapProduct(product: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>) {
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
    found: true,
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category.name,
    shortDescription: product.shortDescription,
    description: product.description?.slice(0, 800),
    size: product.size,
    fabric: product.fabric,
    design: product.design,
    price: formatMoney(product.salePriceMinor),
    priceMinor: product.salePriceMinor,
    stockStatus: product.stockStatus,
    stockQuantity: product.stockQuantity,
    url: `/products/${product.slug}`,
    imageUrl: product.images.find((img) => img.isPrimary)?.url ?? product.images[0]?.url ?? null,
    inStock: product.stockStatus !== "out_of_stock",
    variants,
  };
}

export async function runGetProduct(ctx: ToolContext): Promise<ToolResult | null> {
  const slug = ctx.slug ?? extractSlug(ctx.message);
  const nameQuery = extractProductName(ctx.message);
  const lower = ctx.message.toLowerCase();
  const wantsDetail =
    Boolean(slug) ||
    Boolean(nameQuery) ||
    lower.includes("detail") ||
    lower.includes("spec") ||
    lower.includes("tell me about") ||
    lower.includes("more about");

  if (!wantsDetail) return null;

  if (slug) {
    const product = await getProductBySlug(slug);
    if (product) {
      return {
        tool: "get_product",
        summary: `Loaded product "${product.name}".`,
        data: mapProduct(product),
      };
    }
  }

  if (nameQuery && nameQuery.length > 2) {
    const result = await listProducts({ search: nameQuery, pageSize: 3, sort: "name" });
    const match = result.items[0];
    if (match) {
      const product = await getProductBySlug(match.slug);
      if (product) {
        return {
          tool: "get_product",
          summary: `Loaded product "${product.name}".`,
          data: mapProduct(product),
        };
      }
    }
  }

  return {
    tool: "get_product",
    summary: `No product found${slug ? ` for slug "${slug}"` : nameQuery ? ` matching "${nameQuery}"` : ""}.`,
    data: { slug, found: false },
  };
}
