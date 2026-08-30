import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createGuestCustomer, getOrCreateCart, resolveCustomerCart } from "@/server/cart";
import { placeOrder } from "@/server/orders";

const schema = z.object({
  email: z.string().email(),
  fulfilmentType: z.enum(["DELIVERY", "BRANCH_PICKUP"]).default("DELIVERY"),
  storeId: z.string().optional(),
  paymentMethod: z.enum(["COD", "CARD"]).default("COD"),
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

    const body = schema.parse(await request.json());

    const customerId = user?.id
      ? await resolveCustomerCart(user.id)
      : await createGuestCustomer(body.shipping.phone);
    const cart = await getOrCreateCart(user?.id ? customerId : undefined);

    if (!cart?.cart_items?.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (body.paymentMethod === "CARD") {
      return NextResponse.json(
        { error: "Online payment is coming soon. Please use Cash on Delivery." },
        { status: 400 }
      );
    }

    const order = await placeOrder({
      customerId,
      cartId: cart.id,
      fulfilmentType: body.fulfilmentType,
      storeId: body.storeId,
      paymentMethod: body.paymentMethod,
      shipping: body.shipping,
      notes: body.notes,
      guestEmail: user?.email ? undefined : body.email,
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
