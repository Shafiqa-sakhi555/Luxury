import { formatMoney } from "@/lib/money";
import { extractOrderNumber, ORDER_NUMBER_PATTERN } from "@/lib/orders/number";
import { getPublicOrderTracking } from "@/server/orders/public-tracking";
import {
  formatOrderForAssistant,
  getCustomerOrderByNumber,
  listCustomerOrdersDetailed,
} from "../orders";
import type { ToolContext, ToolResult } from "./types";

export async function runGetMyOrders(ctx: ToolContext): Promise<ToolResult | null> {
  const lower = ctx.message.toLowerCase();
  if (ORDER_NUMBER_PATTERN.test(ctx.message)) return null;
  if (!/\b(my orders|all orders|order history|recent orders)\b/i.test(lower)) return null;

  const user = ctx.userContext;
  if (!user?.isAuthenticated || !user.customerId) {
    return {
      tool: "get_my_orders",
      summary: "Customer not logged in — order lookup requires authentication.",
      data: {
        authenticated: false,
        loginUrl: "/login",
        instruction: "Ask the customer to paste their order ID (JHS-…) in the homepage search, or log in at /login to see all orders.",
      },
    };
  }

  const orders = await listCustomerOrdersDetailed(user.customerId, 5);

  if (orders.length === 0) {
    return {
      tool: "get_my_orders",
      summary: "No orders found for this account.",
      data: {
        authenticated: true,
        count: 0,
        orders: [],
        accountUrl: "/account/orders",
      },
    };
  }

  return {
    tool: "get_my_orders",
    summary: `Found ${orders.length} recent order(s).`,
    data: {
      authenticated: true,
      count: orders.length,
      orders: orders.map((o) => ({
        orderNumber: o.order_number,
        status: o.status,
        total: formatMoney(o.total_minor),
        placedAt: o.created_at,
        accountUrl: "/account/orders",
      })),
      accountUrl: "/account/orders",
    },
  };
}

export async function runGetOrderStatus(ctx: ToolContext): Promise<ToolResult | null> {
  const orderMatch = ctx.message.match(ORDER_NUMBER_PATTERN);
  const lower = ctx.message.toLowerCase();
  const wantsStatus =
    Boolean(orderMatch) ||
    /\b(order status|track order|where is my order|my order|trace order)\b/i.test(lower);

  if (!wantsStatus) return null;

  if (orderMatch) {
    const orderNumber = extractOrderNumber(ctx.message) ?? orderMatch[1].toUpperCase();
    const user = ctx.userContext;

    if (user?.isAuthenticated && user.customerId) {
      const order = await getCustomerOrderByNumber(user.customerId, orderNumber);
      if (order) {
        return {
          tool: "get_order_status",
          summary: `Order ${orderNumber} is ${order.status}.`,
          data: {
            authenticated: true,
            found: true,
            order: await formatOrderForAssistant(order),
            trackUrl: `/track/${orderNumber}`,
          },
        };
      }
    }

    const publicOrder = await getPublicOrderTracking(orderNumber);
    if (!publicOrder) {
      return {
        tool: "get_order_status",
        summary: `Order ${orderNumber} was not found.`,
        data: { found: false, orderNumber, trackUrl: `/track/${orderNumber}` },
      };
    }

    return {
      tool: "get_order_status",
      summary: `Order ${publicOrder.orderNumber} is ${publicOrder.status}.`,
      data: {
        found: true,
        orderNumber: publicOrder.orderNumber,
        status: publicOrder.status,
        total: formatMoney(publicOrder.totalMinor),
        city: publicOrder.shippingCity,
        items: publicOrder.items.map((item) => `${item.name} × ${item.quantity}`),
        trackUrl: `/track/${publicOrder.orderNumber}`,
        instruction: "Share the status and the track URL. Do not invent extra details.",
      },
    };
  }

  const user = ctx.userContext;
  if (!user?.isAuthenticated || !user.customerId) {
    return {
      tool: "get_order_status",
      summary: "Ask for the order ID (JHS-…) or send them to the homepage search to trace the order.",
      data: {
        authenticated: false,
        trackUrl: "/track",
        instruction:
          "Guest checkout does not require login. Ask for the order ID from the confirmation page, or send them to /track or the homepage search.",
      },
    };
  }

  const orders = await listCustomerOrdersDetailed(user.customerId, 1);
  if (orders.length === 0) {
    return {
      tool: "get_order_status",
      summary: "No orders on this account.",
      data: { authenticated: true, found: false, orders: [] },
    };
  }

  const order = await getCustomerOrderByNumber(user.customerId, orders[0].order_number);
  if (!order) {
    return { tool: "get_order_status", summary: "Could not load order.", data: { found: false } };
  }

  return {
    tool: "get_order_status",
    summary: `Latest order ${order.order_number} — ${order.status}.`,
    data: {
      authenticated: true,
      found: true,
      order: await formatOrderForAssistant(order),
    },
  };
}
