import { db } from "@/server/db";
import { cartTotals } from "@/server/cart";
import type { FulfilmentType, PaymentMethod } from "@/generated/prisma/client";

function generateOrderNumber() {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `JHS-${y}${m}${d}-${rand}`;
}

export type PlaceOrderInput = {
  customerId: string;
  cartId: string;
  fulfilmentType: FulfilmentType;
  paymentMethod?: PaymentMethod;
  storeId?: string;
  shipping: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    region?: string;
    postal?: string;
    phone: string;
  };
  notes?: string;
};

export async function placeOrder(input: PlaceOrderInput) {
  return db.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { id: input.cartId },
      include: {
        items: {
          include: {
            variant: {
              include: { product: { include: { media: { take: 1, orderBy: { sortOrder: "asc" } } } } },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    let subtotalMinor = 0;
    for (const item of cart.items) {
      const price = item.priceSnapshotMinor ?? item.variant.priceMinor;
      subtotalMinor += price * item.quantity;
    }
    const deliveryMinor = subtotalMinor >= 5_000_000 ? 0 : 250_000;
    const totalMinor = subtotalMinor + deliveryMinor;

    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: input.customerId,
        status: "PENDING",
        paymentMethod: input.paymentMethod ?? "COD",
        paymentStatus: "PENDING",
        fulfilmentType: input.fulfilmentType,
        storeId: input.storeId,
        subtotalMinor,
        deliveryMinor,
        totalMinor,
        shippingName: input.shipping.name,
        shippingLine1: input.shipping.line1,
        shippingLine2: input.shipping.line2,
        shippingCity: input.shipping.city,
        shippingRegion: input.shipping.region,
        shippingPostal: input.shipping.postal,
        shippingPhone: input.shipping.phone,
        notes: input.notes,
        items: {
          create: cart.items.map((item) => {
            const unitPrice = item.priceSnapshotMinor ?? item.variant.priceMinor;
            return {
              variantId: item.variantId,
              productName: item.variant.product.name,
              variantSku: item.variant.sku,
              variantName: item.variant.name,
              imageUrl: item.variant.product.media[0]?.url,
              unitPriceMinor: unitPrice,
              quantity: item.quantity,
              lineTotalMinor: unitPrice * item.quantity,
              customization: item.customization ?? undefined,
            };
          }),
        },
        statusHistory: {
          create: { toStatus: "PENDING", reason: "Order placed" },
        },
      },
      include: { items: true },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return order;
  });
}

export async function listCustomerOrders(customerId: string) {
  return db.order.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    include: { items: true, store: true },
  });
}

export async function getOrderByNumber(orderNumber: string, customerId?: string) {
  return db.order.findFirst({
    where: {
      orderNumber,
      ...(customerId ? { customerId } : {}),
    },
    include: {
      items: true,
      store: true,
      statusHistory: { orderBy: { createdAt: "asc" }, include: { actor: { select: { name: true } } } },
      customer: { include: { user: { select: { name: true, email: true } } } },
    },
  });
}

export async function adminListOrders(params: { page?: number; status?: string; search?: string } = {}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = 25;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (params.status) where.status = params.status;
  if (params.search) {
    where.OR = [
      { orderNumber: { contains: params.search, mode: "insensitive" } },
      { shippingName: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    db.order.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { include: { user: { select: { name: true, email: true } } } },
        items: true,
        store: true,
      },
    }),
    db.order.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["RETURNED"],
  RETURNED: ["REFUNDED"],
  CANCELLED: ["REFUNDED"],
};

export async function updateOrderStatus(
  orderId: string,
  toStatus: string,
  actorId: string,
  reason?: string
) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  const allowed = VALID_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(toStatus)) {
    throw new Error(`Cannot transition from ${order.status} to ${toStatus}`);
  }

  return db.$transaction([
    db.order.update({ where: { id: orderId }, data: { status: toStatus as never } }),
    db.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: toStatus as never,
        actorId,
        reason,
      },
    }),
  ]);
}
