import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { getOrCreateCart } from "@/server/cart";
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const customer = await db.customer.findUnique({ where: { userId: session.user.id } });
    if (!customer) {
      return NextResponse.json({ error: "Customer profile missing" }, { status: 400 });
    }

    const body = schema.parse(await request.json());
    const cart = await getOrCreateCart(customer.id);
    if (cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const order = await placeOrder({
      customerId: customer.id,
      cartId: cart.id,
      fulfilmentType: body.fulfilmentType,
      storeId: body.storeId,
      shipping: body.shipping,
      notes: body.notes,
    });

    return NextResponse.json({ orderNumber: order.orderNumber, id: order.id });
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
