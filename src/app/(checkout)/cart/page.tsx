import Link from "next/link";
import Image from "next/image";
import { getOrCreateCart, getCartTotals, resolveCustomerCart } from "@/server/cart";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney, resolveCartItemPriceMinor } from "@/lib/money";
import { resolveCloudinaryImageUrl } from "@/lib/cloudinary/url";
import { CartActions } from "@/components/commerce/CartActions";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { PageContainer } from "@/components/ui/page-container";
import { ShoppingBag } from "lucide-react";

export default async function CartPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let customerId: string | undefined;
  if (user) {
    customerId = await resolveCustomerCart(user.id).catch(() => undefined);
  }

  const cart = await getOrCreateCart(customerId).catch(() => null);
  const totals = await getCartTotals(cart);

  return (
    <PageContainer width="narrow" className="py-8 sm:py-10">
      <div>
      <h1 className="font-display text-3xl text-navy">Your cart</h1>
      {!user && cart?.cart_items?.length ? (
        <p className="mt-2 text-sm text-muted">
          You can checkout as a guest.{" "}
          <Link href="/login?callbackUrl=/checkout" className="text-navy hover:underline">
            Sign in
          </Link>{" "}
          if you want this cart saved to your account.
        </p>
      ) : null}
      {!cart?.cart_items?.length ? (
        <EmptyState
          className="mt-10 surface-card"
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Your cart is empty"
          description="Browse our collections and add items you love."
          action={{ label: "Continue shopping", href: "/shop" }}
        />
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
            <ul className="space-y-4">
              {cart.cart_items.map((item: any) => {
                const product = item.product_variants?.products;
                const productRow = Array.isArray(product) ? product[0] : product;
                const imageRow = productRow?.product_images?.[0];
                const image =
                  resolveCloudinaryImageUrl(
                    imageRow?.image_url,
                    imageRow?.cloudinary_public_id
                  ) ?? "/brand/jalals-logo.png";
                const price = resolveCartItemPriceMinor({
                  priceSnapshotMinor: item.price_snapshot_minor,
                  variantPriceMinor: item.product_variants?.price_minor,
                  variantSalePriceMinor: item.product_variants?.sale_price_minor,
                  productOriginalPriceMinor: productRow?.original_price_minor,
                  productSalePriceMinor: productRow?.sale_price_minor,
                });

                return (
                  <li key={item.id} className="flex gap-4 rounded-xl border border-navy/10 bg-white p-4">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={image}
                        alt={productRow?.name ?? "Product"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <Link
                        href={`/products/${productRow?.slug}`}
                        className="font-medium text-navy hover:underline"
                      >
                        {productRow?.name}
                      </Link>
                      <p className="text-xs text-muted">{item.product_variants?.sku}</p>
                      {item.product_variants?.size ? (
                        <p className="text-xs text-muted">Size: {item.product_variants.size}</p>
                      ) : null}
                      <p className="mt-2 tabular-nums text-navy">{formatMoney(price)}</p>
                      <CartActions itemId={item.id} quantity={item.quantity} />
                    </div>
                  </li>
                );
              })}
            </ul>
            <aside className="h-fit">
              <Card padding="md">
                <h2 className="font-medium text-navy">Order summary</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="tabular-nums">{formatMoney(totals.subtotalMinor)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Delivery</dt>
                  <dd className="tabular-nums">
                    {totals.deliveryMinor === 0 ? "Free" : formatMoney(totals.deliveryMinor)}
                  </dd>
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
              </Card>
            </aside>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
