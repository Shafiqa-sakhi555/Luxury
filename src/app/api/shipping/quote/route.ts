import { NextResponse } from "next/server";
import { getCartTotals, getOrCreateCart, resolveCustomerCart } from "@/server/cart";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { emptyShippingQuote } from "@/lib/shipping/calculate";

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
    const totals = await getCartTotals(cart);
    return NextResponse.json({
      quote: totals.shipping ?? emptyShippingQuote(),
      subtotalMinor: totals.subtotalMinor,
      totalMinor: totals.totalMinor,
      itemCount: totals.itemCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not calculate shipping" },
      { status: 400 }
    );
  }
}

export async function POST() {
  return GET();
}
