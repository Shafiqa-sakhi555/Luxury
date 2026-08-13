import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateCart } from "@/server/cart";
import { CheckoutForm } from "@/components/commerce/CheckoutForm";

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

export default async function CheckoutPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login?callbackUrl=/checkout");
  }

  const { data: customer } = await supabase.from("customers").select("id").eq("profile_id", user.id).maybeSingle();
  if (!customer) redirect("/register");

  const cart = await getOrCreateCart(customer.id);
  if (!cart || !cart.cart_items || cart.cart_items.length === 0) redirect("/cart");

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
