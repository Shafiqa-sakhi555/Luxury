import Link from "next/link";
import Image from "next/image";
import { getOrCreateCart } from "@/server/cart";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import { CartActions } from "@/components/commerce/CartActions";

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

export default async function CartPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let customerId;
  if (user) {
    const { data: customer } = await supabase.from("customers").select("id").eq("profile_id", user.id).maybeSingle();
    customerId = customer?.id;
  }
  
  const cart = await getOrCreateCart(customerId).catch(() => null);
  const totals = cart ? cartTotals(cart) : { subtotalMinor: 0, deliveryMinor: 0, totalMinor: 0, itemCount: 0 };

  return (
    <div>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="font-display text-3xl text-navy">Your cart</h1>
        {!cart || !cart.cart_items || cart.cart_items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-navy/10 bg-white p-12 text-center">
            <p className="text-muted">Your cart is empty.</p>
            <Link href="/shop" className="mt-4 inline-block text-navy hover:underline">
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
            <ul className="space-y-4">
              {cart.cart_items.map((item: any) => {
                const product = item.product_variants?.products;
                const image = product?.product_images?.[0]?.image_url ?? "/brand/jalals-logo.png";
                const price = item.price_snapshot_minor ?? item.product_variants?.price_minor;
                
                return (
                  <li key={item.id} className="flex gap-4 rounded-xl border border-navy/10 bg-white p-4">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={image}
                        alt={product?.name ?? "Product"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <Link href={`/products/${product?.slug}`} className="font-medium text-navy hover:underline">
                        {product?.name}
                      </Link>
                      <p className="text-xs text-muted">{item.product_variants?.sku}</p>
                      <p className="mt-2 tabular-nums text-navy">
                        {formatMoney(price)}
                      </p>
                      <CartActions itemId={item.id} quantity={item.quantity} />
                    </div>
                  </li>
                );
              })}
            </ul>
            <aside className="h-fit rounded-xl border border-navy/10 bg-white p-6">
              <h2 className="font-medium text-navy">Order summary</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="tabular-nums">{formatMoney(totals.subtotalMinor)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Delivery</dt>
                  <dd className="tabular-nums">{formatMoney(totals.deliveryMinor)}</dd>
                </div>
                <div className="flex justify-between border-t border-navy/10 pt-2 font-medium">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatMoney(totals.totalMinor)}</dd>
                </div>
              </dl>
              <Link
                href="/checkout"
                className="mt-6 block rounded-full bg-red py-3 text-center text-sm font-medium text-white hover:bg-red/90"
              >
                Proceed to checkout
              </Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
