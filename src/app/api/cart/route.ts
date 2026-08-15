import { NextResponse } from "next/server";
import {
  addToCart,
  cartTotals,
  getOrCreateCart,
  removeCartItem,
  resolveCustomerCart,
  updateCartItem,
} from "@/server/cart";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function resolveCartCustomerId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return undefined;
  return resolveCustomerCart(user.id);
}

export async function GET() {
  try {
    const customerId = await resolveCartCustomerId();
    const cart = await getOrCreateCart(customerId);
    return NextResponse.json({ cart, totals: cartTotals(cart) });
  } catch {
    return NextResponse.json({
      cart: { cart_items: [] },
      totals: { subtotalMinor: 0, deliveryMinor: 0, totalMinor: 0, itemCount: 0 },
    });
  }
}

export async function POST(request: Request) {
  try {
    const { variantId, quantity = 1 } = await request.json();
    if (!variantId) {
      return NextResponse.json({ error: "variantId required" }, { status: 400 });
    }

    const customerId = await resolveCartCustomerId();
    await addToCart(variantId, quantity, customerId);
    const cart = await getOrCreateCart(customerId);
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
    if (!itemId) {
      return NextResponse.json({ error: "itemId required" }, { status: 400 });
    }

    const customerId = await resolveCartCustomerId();
    await updateCartItem(itemId, quantity, customerId);
    const cart = await getOrCreateCart(customerId);
    return NextResponse.json({ ok: true, totals: cartTotals(cart) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update cart";
    const status = message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

    const customerId = await resolveCartCustomerId();
    await removeCartItem(itemId, customerId);
    const cart = await getOrCreateCart(customerId);
    return NextResponse.json({ ok: true, totals: cartTotals(cart) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove item";
    const status = message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
