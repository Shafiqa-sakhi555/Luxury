import { cartTotals, getOrCreateCart } from "@/server/cart";
import { formatMoney } from "@/lib/money";
import type { ToolContext, ToolResult } from "./types";

export async function runGetMyCart(ctx: ToolContext): Promise<ToolResult | null> {
  const lower = ctx.message.toLowerCase();
  if (
    !/\b(cart|basket|bag)\b/i.test(lower) &&
    !lower.includes("what's in my") &&
    !lower.includes("whats in my")
  ) {
    return null;
  }

  const customerId = ctx.userContext?.customerId ?? undefined;
  const cart = await getOrCreateCart(customerId);
  const totals = cartTotals(cart);

  if (!cart?.cart_items?.length) {
    return {
      tool: "get_my_cart",
      summary: "Cart is empty.",
      data: {
        itemCount: 0,
        items: [],
        totals: {
          subtotal: formatMoney(0),
          delivery: formatMoney(0),
          total: formatMoney(0),
        },
        cartUrl: "/cart",
      },
    };
  }

  const items = (cart.cart_items ?? []).map((item: {
    id: string;
    quantity: number;
    price_snapshot_minor?: number | null;
    product_variants?: {
      sku?: string;
      price_minor?: number | null;
      sale_price_minor?: number | null;
      products?: { name?: string; slug?: string };
    } | null;
  }) => {
    const product = item.product_variants?.products;
    const price =
      item.price_snapshot_minor ??
      item.product_variants?.sale_price_minor ??
      item.product_variants?.price_minor ??
      0;

    return {
      name: product?.name ?? "Product",
      slug: product?.slug,
      sku: item.product_variants?.sku,
      quantity: item.quantity,
      unitPrice: formatMoney(price),
      url: product?.slug ? `/products/${product.slug}` : null,
    };
  });

  return {
    tool: "get_my_cart",
    summary: `Cart has ${totals.itemCount} item(s).`,
    data: {
      itemCount: totals.itemCount,
      items,
      totals: {
        subtotal: formatMoney(totals.subtotalMinor),
        delivery: formatMoney(totals.deliveryMinor),
        total: formatMoney(totals.totalMinor),
      },
      cartUrl: "/cart",
      checkoutUrl: "/checkout",
    },
  };
}
