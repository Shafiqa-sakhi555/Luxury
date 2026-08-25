import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveCartItemPriceMinor } from "@/lib/money";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import {
  deliveryFeeForSubtotal,
  getStoreSettings,
} from "@/server/settings/store-settings";

const CART_COOKIE = "jalals_cart_token";

const CART_SELECT =
  "*, cart_items(*, product_variants(*, products(*, product_images(*))))";

export async function getCartToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CART_COOKIE)?.value;
  if (!token) {
    token = randomBytes(24).toString("hex");
    cookieStore.set(CART_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }
  return token;
}

function getCartTokenFromCookie() {
  return cookies().then((store) => store.get(CART_COOKIE)?.value ?? null);
}

async function findOrCreateCustomerCart(customerId: string) {
  const supabase = createSupabaseAdminClient();
  let { data: cart } = await supabase
    .from("carts")
    .select(CART_SELECT)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (!cart) {
    const { data: newCart } = await supabase
      .from("carts")
      .insert({ customer_id: customerId })
      .select(CART_SELECT)
      .single();
    cart = newCart;
  }

  return cart;
}

async function findOrCreateGuestCart(token: string) {
  const supabase = createSupabaseAdminClient();
  let { data: cart } = await supabase
    .from("carts")
    .select(CART_SELECT)
    .eq("token", token)
    .maybeSingle();

  if (!cart) {
    const { data: newCart } = await supabase
      .from("carts")
      .insert({ token })
      .select(CART_SELECT)
      .single();
    cart = newCart;
  }

  return cart;
}

export async function ensureCustomerForProfile(profileId: string) {
  const supabase = createSupabaseAdminClient();

  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from("customers")
    .insert({ profile_id: profileId })
    .select("id")
    .single();

  if (error || !created) {
    throw new Error("Could not create customer profile.");
  }

  return created.id;
}

export async function mergeGuestCartIntoCustomerCart(customerId: string) {
  const token = await getCartTokenFromCookie();
  if (!token) return;

  const supabase = createSupabaseAdminClient();
  const { data: guestCart } = await supabase
    .from("carts")
    .select("id, cart_items(variant_id, quantity, price_snapshot_minor)")
    .eq("token", token)
    .maybeSingle();

  if (!guestCart?.cart_items?.length) return;

  const customerCart = await findOrCreateCustomerCart(customerId);
  if (!customerCart) return;

  for (const item of guestCart.cart_items) {
    await upsertCartItem(
      customerCart.id,
      item.variant_id,
      item.quantity,
      item.price_snapshot_minor ?? undefined
    );
  }

  await supabase.from("cart_items").delete().eq("cart_id", guestCart.id);
  await supabase.from("carts").delete().eq("id", guestCart.id);
}

export async function resolveCustomerCart(userId: string) {
  const customerId = await ensureCustomerForProfile(userId);
  await mergeGuestCartIntoCustomerCart(customerId);
  return customerId;
}

export async function getOrCreateCart(customerId?: string) {
  if (customerId) {
    await mergeGuestCartIntoCustomerCart(customerId);
    return findOrCreateCustomerCart(customerId);
  }

  const token = await getCartToken();
  return findOrCreateGuestCart(token);
}

async function upsertCartItem(
  cartId: string,
  variantId: string,
  quantity: number,
  priceSnapshotMinor?: number
) {
  const supabase = createSupabaseAdminClient();

  let price = priceSnapshotMinor;
  if (price === undefined) {
    const { data: variant } = await supabase
      .from("product_variants")
      .select(
        "sale_price_minor, price_minor, products(status, original_price_minor, sale_price_minor)"
      )
      .eq("id", variantId)
      .single();

    if (!variant) {
      throw new Error("Product unavailable");
    }

    const product = Array.isArray(variant.products) ? variant.products[0] : variant.products;
    if (product?.status !== "ACTIVE") {
      throw new Error("Product unavailable");
    }

    price = resolveCartItemPriceMinor({
      variantPriceMinor: variant.price_minor,
      variantSalePriceMinor: variant.sale_price_minor,
      productOriginalPriceMinor: product?.original_price_minor,
      productSalePriceMinor: product?.sale_price_minor,
    });
  }

  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("variant_id", variantId)
    .maybeSingle();

  if (existing) {
    return supabase
      .from("cart_items")
      .update({
        quantity: existing.quantity + quantity,
        price_snapshot_minor: price,
      })
      .eq("id", existing.id);
  }

  return supabase.from("cart_items").insert({
    cart_id: cartId,
    variant_id: variantId,
    quantity,
    price_snapshot_minor: price,
  });
}

export async function addToCart(variantId: string, quantity = 1, customerId?: string) {
  const cart = await getOrCreateCart(customerId);
  if (!cart) throw new Error("Could not open cart.");

  return upsertCartItem(cart.id, variantId, quantity);
}

async function getCartItemWithCart(itemId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: item } = await supabase
    .from("cart_items")
    .select("id, cart_id, carts(customer_id, token)")
    .eq("id", itemId)
    .maybeSingle();

  return item;
}

export async function assertCartItemAccess(itemId: string, customerId?: string) {
  const item = await getCartItemWithCart(itemId);
  if (!item?.carts) throw new Error("Cart item not found.");

  const cart = Array.isArray(item.carts) ? item.carts[0] : item.carts;

  if (customerId) {
    if (cart.customer_id !== customerId) throw new Error("Forbidden");
    return;
  }

  const token = await getCartTokenFromCookie();
  if (!token || cart.token !== token) throw new Error("Forbidden");
}

export async function updateCartItem(itemId: string, quantity: number, customerId?: string) {
  await assertCartItemAccess(itemId, customerId);

  const supabase = createSupabaseAdminClient();
  if (quantity <= 0) return supabase.from("cart_items").delete().eq("id", itemId);
  return supabase.from("cart_items").update({ quantity }).eq("id", itemId);
}

export async function removeCartItem(itemId: string, customerId?: string) {
  await assertCartItemAccess(itemId, customerId);
  const supabase = createSupabaseAdminClient();
  return supabase.from("cart_items").delete().eq("id", itemId);
}

function readProductPrices(product: unknown) {
  const row = Array.isArray(product) ? product[0] : product;
  if (!row || typeof row !== "object") {
    return { originalPriceMinor: 0, salePriceMinor: 0 };
  }
  const record = row as {
    original_price_minor?: number | null;
    sale_price_minor?: number | null;
  };
  return {
    originalPriceMinor: record.original_price_minor ?? 0,
    salePriceMinor: record.sale_price_minor ?? 0,
  };
}

export async function cartTotals(cart: {
  cart_items?: Array<{
    quantity: number;
    price_snapshot_minor?: number | null;
    product_variants?: {
      price_minor?: number | null;
      sale_price_minor?: number | null;
      products?: {
        original_price_minor?: number | null;
        sale_price_minor?: number | null;
      } | null;
    } | null;
  }> | null;
} | null) {
  if (!cart?.cart_items?.length) {
    return { subtotalMinor: 0, deliveryMinor: 0, totalMinor: 0, itemCount: 0 };
  }

  let subtotalMinor = 0;
  let itemCount = 0;

  for (const item of cart.cart_items) {
    const variant = item.product_variants;
    const productPrices = readProductPrices(variant?.products);
    const price = resolveCartItemPriceMinor({
      priceSnapshotMinor: item.price_snapshot_minor,
      variantPriceMinor: variant?.price_minor,
      variantSalePriceMinor: variant?.sale_price_minor,
      productOriginalPriceMinor: productPrices.originalPriceMinor,
      productSalePriceMinor: productPrices.salePriceMinor,
    });
    subtotalMinor += price * item.quantity;
    itemCount += item.quantity;
  }

  const settings = await getStoreSettings();
  const deliveryMinor = deliveryFeeForSubtotal(subtotalMinor, settings);
  return {
    subtotalMinor,
    deliveryMinor,
    totalMinor: subtotalMinor + deliveryMinor,
    itemCount,
  };
}
