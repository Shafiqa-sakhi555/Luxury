import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveCartItemPriceMinor } from "@/lib/money";
import { isSquareFootPricing } from "@/lib/catalog/product-pricing";
import { categorySlugsMatch } from "@/lib/supabase/catalog-categories";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import {
  DEFAULT_DELIVERY_FEE_MINOR,
  DEFAULT_FREE_DELIVERY_THRESHOLD_MINOR,
  deliveryFeeForSubtotal,
  getStoreSettings,
  type StoreSettings,
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
    .select("id, cart_items(variant_id, quantity, price_snapshot_minor, customization)")
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
      item.price_snapshot_minor ?? undefined,
      item.customization ?? undefined
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

export async function createGuestCustomer(phone: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("customers")
    .insert({ phone: phone.trim() || null })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not start guest checkout.");
  }

  return data.id;
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
  priceSnapshotMinor?: number,
  customization?: Record<string, unknown> | null
) {
  const supabase = createSupabaseAdminClient();

  let price = priceSnapshotMinor;
  let finalCustomization = customization ?? null;

  const { data: variant } = await supabase
    .from("product_variants")
    .select(
      "sale_price_minor, price_minor, products(status, original_price_minor, sale_price_minor, selling_unit, categories(slug, name))"
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

  const productPrices = {
    originalPriceMinor: product?.original_price_minor ?? 0,
    salePriceMinor: product?.sale_price_minor ?? 0,
  };

  const baseRateMinor = resolveCartItemPriceMinor({
    variantPriceMinor: variant.price_minor,
    variantSalePriceMinor: variant.sale_price_minor,
    productOriginalPriceMinor: productPrices.originalPriceMinor,
    productSalePriceMinor: productPrices.salePriceMinor,
  });

  const category = Array.isArray(product?.categories) ? product.categories[0] : product?.categories;
  const categorySlug = category?.slug;
  const isCarpet =
    isSquareFootPricing({
      salePriceMinor: productPrices.salePriceMinor || variant.sale_price_minor || 0,
      originalPriceMinor: productPrices.originalPriceMinor || variant.price_minor || 0,
      sellingUnit: product?.selling_unit,
      categorySlug,
    }) ||
    categorySlugsMatch(categorySlug, "carpets") ||
    (category?.name && /carpet/i.test(category.name));

  if (price === undefined) {
    if (isCarpet && customization && (customization.areaSqFt || (customization.length && customization.width))) {
      const length = Number(customization.length);
      const width = Number(customization.width);
      const area = customization.areaSqFt
        ? Number(customization.areaSqFt)
        : Math.round(length * width * 100) / 100;
      if (area > 0) {
        price = Math.round(baseRateMinor * area);
        finalCustomization = {
          ...customization,
          length: length > 0 ? length : undefined,
          width: width > 0 ? width : undefined,
          areaSqFt: area,
          ratePerSqFtMinor: baseRateMinor,
          dimensions: customization.dimensions || `${length} ft × ${width} ft`,
          size: customization.size || `${length} ft × ${width} ft (${area} sq ft)`,
        };
      } else {
        price = baseRateMinor;
      }
    } else {
      price = baseRateMinor;
    }
  }

  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity, customization")
    .eq("cart_id", cartId)
    .eq("variant_id", variantId)
    .maybeSingle();

  if (existing) {
    return supabase
      .from("cart_items")
      .update({
        quantity: existing.quantity + quantity,
        price_snapshot_minor: price,
        customization: finalCustomization ?? existing.customization,
      })
      .eq("id", existing.id);
  }

  return supabase.from("cart_items").insert({
    cart_id: cartId,
    variant_id: variantId,
    quantity,
    price_snapshot_minor: price,
    customization: finalCustomization,
  });
}

export async function addToCart(
  variantId: string,
  quantity = 1,
  customerId?: string,
  customization?: Record<string, unknown> | null
) {
  const cart = await getOrCreateCart(customerId);
  if (!cart) throw new Error("Could not open cart.");

  return upsertCartItem(cart.id, variantId, quantity, undefined, customization);
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

export async function cartTotals(
  cart: {
    cart_items?: Array<{
      quantity: number;
      price_snapshot_minor?: number | null;
      customization?: Record<string, unknown> | null;
      product_variants?: {
        weight?: string | number | null;
        price_minor?: number | null;
        sale_price_minor?: number | null;
        products?: {
          id?: string;
          name?: string | null;
          shipping_type?: string | null;
          shipping_weight_kg?: number | string | null;
          furniture_kind?: string | null;
          categories?: {
            slug?: string | null;
            name?: string | null;
          } | Array<{ slug?: string | null; name?: string | null }> | null;
          original_price_minor?: number | null;
          sale_price_minor?: number | null;
        } | null;
      } | null;
    }> | null;
  } | null,
  settings: StoreSettings = {
    deliveryFeeMinor: DEFAULT_DELIVERY_FEE_MINOR,
    freeDeliveryThresholdMinor: DEFAULT_FREE_DELIVERY_THRESHOLD_MINOR,
  }
) {
  if (!cart?.cart_items?.length) {
    const { emptyShippingQuote } = await import("@/lib/shipping/calculate");
    return { subtotalMinor: 0, deliveryMinor: 0, totalMinor: 0, itemCount: 0, shipping: emptyShippingQuote() };
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
      hasCustomization: Boolean((item as { customization?: unknown }).customization),
    });
    subtotalMinor += price * item.quantity;
    itemCount += item.quantity;
  }

  const { cartToShippingItems } = await import("@/server/shipping/from-cart");
  const { calculateShippingQuote } = await import("@/lib/shipping/calculate");
  const { getShippingRates } = await import("@/server/shipping/settings");

  const rates = await getShippingRates();
  const shippingItems = cartToShippingItems(cart as Parameters<typeof cartToShippingItems>[0]);
  const quote = calculateShippingQuote(shippingItems, rates, subtotalMinor);

  return {
    subtotalMinor,
    deliveryMinor: quote.shippingMinor,
    totalMinor: subtotalMinor + quote.shippingMinor,
    itemCount,
    shipping: quote
  };
}

export async function getCartTotals(
  cart: Parameters<typeof cartTotals>[0]
) {
  const settings = await getStoreSettings();
  return cartTotals(cart, settings);
}
