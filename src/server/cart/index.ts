import { db } from "@/server/db";
import { effectivePriceMinor } from "@/lib/money";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

const CART_COOKIE = "jalals_cart_token";

export async function getCartToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CART_COOKIE)?.value;
  if (!token) {
    token = randomBytes(24).toString("hex");
    cookieStore.set(CART_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }
  return token;
}

export async function getOrCreateCart(customerId?: string) {
  if (customerId) {
    let cart = await db.cart.findUnique({
      where: { customerId },
      include: cartInclude,
    });
    if (!cart) {
      cart = await db.cart.create({
        data: { customerId },
        include: cartInclude,
      });
    }
    return cart;
  }

  const token = await getCartToken();
  let cart = await db.cart.findUnique({
    where: { token },
    include: cartInclude,
  });
  if (!cart) {
    cart = await db.cart.create({
      data: { token, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      include: cartInclude,
    });
  }
  return cart;
}

const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            include: { media: { orderBy: { sortOrder: "asc" as const }, take: 1 } },
          },
        },
      },
    },
  },
} as const;

export async function addToCart(variantId: string, quantity = 1, customerId?: string) {
  const cart = await getOrCreateCart(customerId);
  const variant = await db.productVariant.findUnique({
    where: { id: variantId, isActive: true },
    include: { product: true },
  });
  if (!variant || variant.product.status !== "ACTIVE") {
    throw new Error("Product unavailable");
  }

  const price = effectivePriceMinor(variant.priceMinor, variant.salePriceMinor);

  const existing = await db.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
  });

  if (existing) {
    return db.cartItem.update({
      where: { id: existing.id },
      data: {
        quantity: existing.quantity + quantity,
        priceSnapshotMinor: price,
      },
    });
  }

  return db.cartItem.create({
    data: {
      cartId: cart.id,
      variantId,
      quantity,
      priceSnapshotMinor: price,
    },
  });
}

export async function updateCartItem(itemId: string, quantity: number) {
  if (quantity <= 0) {
    return db.cartItem.delete({ where: { id: itemId } });
  }
  return db.cartItem.update({ where: { id: itemId }, data: { quantity } });
}

export async function removeCartItem(itemId: string) {
  return db.cartItem.delete({ where: { id: itemId } });
}

export function cartTotals(cart: Awaited<ReturnType<typeof getOrCreateCart>>) {
  let subtotalMinor = 0;
  let itemCount = 0;
  for (const item of cart.items) {
    const price = item.priceSnapshotMinor ?? item.variant.priceMinor;
    subtotalMinor += price * item.quantity;
    itemCount += item.quantity;
  }
  const deliveryMinor = subtotalMinor >= 5_000_000 ? 0 : 250_000;
  return { subtotalMinor, deliveryMinor, totalMinor: subtotalMinor + deliveryMinor, itemCount };
}
