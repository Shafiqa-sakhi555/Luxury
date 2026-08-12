import { NextResponse } from "next/server";
import { addToCart, getOrCreateCart, removeCartItem, updateCartItem, cartTotals } from "@/server/cart";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    const customerId = session?.user?.id
      ? (await import("@/server/db").then((m) =>
          m.db.customer.findUnique({ where: { userId: session.user!.id } })
        ))?.id
      : undefined;
    const cart = await getOrCreateCart(customerId);
    return NextResponse.json({ cart, totals: cartTotals(cart) });
  } catch {
    return NextResponse.json({ cart: { items: [] }, totals: { subtotalMinor: 0, deliveryMinor: 0, totalMinor: 0, itemCount: 0 } });
  }
}

export async function POST(request: Request) {
  try {
    const { variantId, quantity = 1 } = await request.json();
    if (!variantId) {
      return NextResponse.json({ error: "variantId required" }, { status: 400 });
    }
    const session = await auth();
    const customer = session?.user?.id
      ? await (await import("@/server/db")).db.customer.findUnique({ where: { userId: session.user.id } })
      : null;
    await addToCart(variantId, quantity, customer?.id);
    const cart = await getOrCreateCart(customer?.id);
    return NextResponse.json({ ok: true, totals: cartTotals(cart) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add to cart" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { itemId, quantity } = await request.json();
    await updateCartItem(itemId, quantity);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update cart" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
    await removeCartItem(itemId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove item" }, { status: 400 });
  }
}
