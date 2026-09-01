import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveCloudinaryImageUrl } from "@/lib/cloudinary/url";
import { resolveCartItemPriceMinor } from "@/lib/money";
import { getCartTotals, getOrCreateCart, resolveCustomerCart } from "@/server/cart";
import { CheckoutForm, type CheckoutLineItem } from "@/components/commerce/CheckoutForm";

export default async function CheckoutPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let customerId: string | undefined;
  if (user) {
    customerId = await resolveCustomerCart(user.id).catch(() => undefined);
  }

  const cart = await getOrCreateCart(customerId);
  if (!cart?.cart_items?.length) redirect("/cart");

  const totals = await getCartTotals(cart);

  const lineItems: CheckoutLineItem[] = cart.cart_items.map((item: {
    id: string;
    quantity: number;
    price_snapshot_minor?: number | null;
    product_variants?: {
      sku?: string | null;
      color?: string | null;
      size?: string | null;
      price_minor?: number | null;
      sale_price_minor?: number | null;
      products?: {
        name?: string | null;
        slug?: string | null;
        original_price_minor?: number | null;
        sale_price_minor?: number | null;
        product_images?: Array<{
          image_url?: string | null;
          cloudinary_public_id?: string | null;
        }> | null;
      } | null;
    } | null;
  }) => {
    const product = item.product_variants?.products;
    const productRow = Array.isArray(product) ? product[0] : product;
    const imageRow = productRow?.product_images?.[0];
    const image =
      resolveCloudinaryImageUrl(
        imageRow?.image_url,
        imageRow?.cloudinary_public_id
      ) ?? "/brand/jalals-logo.png";
    const unitPriceMinor = resolveCartItemPriceMinor({
      priceSnapshotMinor: item.price_snapshot_minor,
      variantPriceMinor: item.product_variants?.price_minor,
      variantSalePriceMinor: item.product_variants?.sale_price_minor,
      productOriginalPriceMinor: productRow?.original_price_minor,
      productSalePriceMinor: productRow?.sale_price_minor,
    });

    return {
      id: item.id,
      name: productRow?.name ?? "Product",
      slug: productRow?.slug ?? undefined,
      image,
      quantity: item.quantity,
      unitPriceMinor,
      sku: item.product_variants?.sku ?? undefined,
      color: item.product_variants?.color?.trim() || undefined,
      size: item.product_variants?.size?.trim() || undefined,
    };
  });

  return (
    <CheckoutForm
      totals={totals}
      lineItems={lineItems}
      userEmail={user?.email ?? ""}
    />
  );
}
