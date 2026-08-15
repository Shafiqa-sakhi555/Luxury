import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateCart, resolveCustomerCart } from "@/server/cart";
import { placeOrder } from "@/server/orders";

const schema = z.object({
  fulfilmentType: z.enum(["DELIVERY", "BRANCH_PICKUP"]).default("DELIVERY"),
  storeId: z.string().optional(),
  shipping: z.object({
    name: z.string().min(1),
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    region: z.string().optional(),
    postal: z.string().optional(),
    phone: z.string().min(1),
  }),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const customerId = await resolveCustomerCart(user.id);
    const body = schema.parse(await request.json());
    const cart = await getOrCreateCart(customerId);

    if (!cart?.cart_items?.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const order = await placeOrder({
      customerId,
      cartId: cart.id,
      fulfilmentType: body.fulfilmentType,
      storeId: body.storeId,
      shipping: body.shipping,
      notes: body.notes,
    });

    return NextResponse.json({ orderNumber: order.order_number, id: order.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid checkout data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
