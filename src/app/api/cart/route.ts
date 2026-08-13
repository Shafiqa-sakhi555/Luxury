import { NextResponse } from "next/server";
import { addToCart, getOrCreateCart, removeCartItem, updateCartItem } from "@/server/cart";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function cartTotals(cart: any) {
  if (!cart || !cart.cart_items) return { subtotalMinor: 0, deliveryMinor: 0, totalMinor: 0, itemCount: 0 };
  
  let subtotalMinor = 0;
  let itemCount = 0;
  
  for (const item of cart.cart_items) {
    const price = item.price_snapshot_minor ?? item.product_variants?.price_minor ?? 0;
    subtotalMinor += price * item.quantity;
    itemCount += item.quantity;
  }
  
  const deliveryMinor = subtotalMinor >= 5_000_000 ? 0 : 250_000;
  return {
    subtotalMinor,
    deliveryMinor,
    totalMinor: subtotalMinor + deliveryMinor,
    itemCount
  };
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    let customerId;
    if (user) {
      const { data: customer } = await supabase.from("customers").select("id").eq("profile_id", user.id).maybeSingle();
      customerId = customer?.id;
    }
    
    const cart = await getOrCreateCart(customerId);
    return NextResponse.json({ cart, totals: cartTotals(cart) });
  } catch {
    return NextResponse.json({ cart: { cart_items: [] }, totals: { subtotalMinor: 0, deliveryMinor: 0, totalMinor: 0, itemCount: 0 } });
  }
}

export async function POST(request: Request) {
  try {
    const { variantId, quantity = 1 } = await request.json();
    if (!variantId) {
      return NextResponse.json({ error: "variantId required" }, { status: 400 });
    }
    
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    let customerId;
    if (user) {
      const { data: customer } = await supabase.from("customers").select("id").eq("profile_id", user.id).maybeSingle();
      customerId = customer?.id;
    }
    
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
