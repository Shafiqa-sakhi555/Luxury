import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cartTotals, getOrCreateCart, resolveCustomerCart } from "@/server/cart";
import { CheckoutForm } from "@/components/commerce/CheckoutForm";

export default async function CheckoutPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?callbackUrl=/checkout");
  }

  let customerId: string;
  try {
    customerId = await resolveCustomerCart(user.id);
  } catch {
    redirect("/register?callbackUrl=/checkout");
  }

  const cart = await getOrCreateCart(customerId);
  if (!cart?.cart_items?.length) redirect("/cart");

  const totals = cartTotals(cart);

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Checkout</h1>
      <p className="mt-2 text-sm text-muted">Complete your order with cash on delivery.</p>
      <div className="mt-8">
        <CheckoutForm totals={totals} />
      </div>
      <p className="mt-6 text-sm text-muted">
        <Link href="/cart" className="text-navy hover:underline">
          Back to cart
        </Link>
      </p>
    </div>
  );
}
