import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { getOrCreateCart, cartTotals } from "@/server/cart";
import { CheckoutForm } from "@/components/commerce/CheckoutForm";

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/checkout");
  }

  const customer = await db.customer.findUnique({ where: { userId: session.user.id } });
  if (!customer) redirect("/register");

  const cart = await getOrCreateCart(customer.id);
  if (cart.items.length === 0) redirect("/cart");

  const totals = cartTotals(cart);

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Checkout</h1>
      <p className="mt-2 text-sm text-muted">Complete your order with cash on delivery.</p>
      <div className="mt-8">
        <CheckoutForm totals={totals} />
      </div>
      <p className="mt-6 text-sm text-muted">
        <Link href="/cart" className="text-navy hover:underline">Back to cart</Link>
      </p>
    </div>
  );
}
