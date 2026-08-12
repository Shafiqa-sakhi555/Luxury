import Link from "next/link";
import Image from "next/image";
import { getOrCreateCart, cartTotals, removeCartItem } from "@/server/cart";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { formatMoney } from "@/lib/money";
import { CartActions } from "@/components/commerce/CartActions";

export default async function CartPage() {
  const session = await auth();
  const customer = session?.user?.id
    ? await db.customer.findUnique({ where: { userId: session.user.id } })
    : null;
  const cart = await getOrCreateCart(customer?.id).catch(() => null);
  const totals = cart ? cartTotals(cart) : { subtotalMinor: 0, deliveryMinor: 0, totalMinor: 0, itemCount: 0 };

  return (
    <div>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="font-display text-3xl text-navy">Your cart</h1>
        {!cart || cart.items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-navy/10 bg-white p-12 text-center">
            <p className="text-muted">Your cart is empty.</p>
            <Link href="/shop" className="mt-4 inline-block text-navy hover:underline">
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
            <ul className="space-y-4">
              {cart.items.map((item) => (
                <li key={item.id} className="flex gap-4 rounded-xl border border-navy/10 bg-white p-4">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={item.variant.product.media[0]?.url ?? "/brand/jalals-logo.png"}
                      alt={item.variant.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <Link href={`/products/${item.variant.product.slug}`} className="font-medium text-navy hover:underline">
                      {item.variant.product.name}
                    </Link>
                    <p className="text-xs text-muted">{item.variant.sku}</p>
                    <p className="mt-2 tabular-nums text-navy">
                      {formatMoney(item.priceSnapshotMinor ?? item.variant.priceMinor)}
                    </p>
                    <CartActions itemId={item.id} quantity={item.quantity} />
                  </div>
                </li>
              ))}
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
