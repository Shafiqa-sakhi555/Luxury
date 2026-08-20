import { formatMoney } from "@/lib/money";
import {
  formatOrderForAssistant,
  getCustomerOrderByNumber,
  listCustomerOrdersDetailed,
} from "../orders";
import type { ToolContext, ToolResult } from "./types";

const ORDER_NUMBER_PATTERN = /\b(JHS-\d+-[A-Z0-9]+)\b/i;

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
        instruction: "Ask the customer to log in at /login to view their orders.",
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
    /\b(order status|track order|where is my order|my order)\b/i.test(lower);

  if (!wantsStatus) return null;

  const user = ctx.userContext;
  if (!user?.isAuthenticated || !user.customerId) {
    return {
      tool: "get_order_status",
      summary: "Order status requires login.",
      data: {
        authenticated: false,
        loginUrl: "/login",
        instruction: "Customer must log in to check order status. Do not guess order details.",
      },
    };
  }

  if (orderMatch) {
    const orderNumber = orderMatch[1].toUpperCase();
    const order = await getCustomerOrderByNumber(user.customerId, orderNumber);

    if (!order) {
      return {
        tool: "get_order_status",
        summary: `Order ${orderNumber} not found on this account.`,
        data: {
          authenticated: true,
          found: false,
          orderNumber,
        },
      };
    }

    return {
      tool: "get_order_status",
      summary: `Order ${orderNumber} is ${order.status}.`,
      data: {
        authenticated: true,
        found: true,
        order: await formatOrderForAssistant(order),
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
