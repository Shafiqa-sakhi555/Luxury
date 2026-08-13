import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

const CART_COOKIE = "jalals_cart_token";

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

export async function getOrCreateCart(customerId?: string) {
  const supabase = createSupabaseAdminClient(); // Admin client to bypass RLS for guest carts
  
  if (customerId) {
    let { data: cart } = await supabase.from("carts").select("*, cart_items(*, product_variants(*, products(*, product_images(*))))").eq("customer_id", customerId).maybeSingle();
    if (!cart) {
      const { data: newCart } = await supabase.from("carts").insert({ customer_id: customerId }).select("*, cart_items(*, product_variants(*, products(*, product_images(*))))").single();
      cart = newCart;
    }
    return cart;
  }

  const token = await getCartToken();
  let { data: cart } = await supabase.from("carts").select("*, cart_items(*, product_variants(*, products(*, product_images(*))))").eq("token", token).maybeSingle();
  if (!cart) {
    const { data: newCart } = await supabase.from("carts").insert({ token }).select("*, cart_items(*, product_variants(*, products(*, product_images(*))))").single();
    cart = newCart;
  }
  return cart;
}

export async function addToCart(variantId: string, quantity = 1, customerId?: string) {
  const supabase = createSupabaseAdminClient();
  const cart = await getOrCreateCart(customerId);
  
  const { data: variant } = await supabase.from("product_variants").select("*, products(*)").eq("id", variantId).single();
  if (!variant || variant.products.status !== "ACTIVE") throw new Error("Product unavailable");

  const price = variant.sale_price_minor > 0 ? variant.sale_price_minor : variant.price_minor;

  const { data: existing } = await supabase.from("cart_items").select("*").eq("cart_id", cart.id).eq("variant_id", variantId).maybeSingle();

  if (existing) {
    return supabase.from("cart_items").update({ quantity: existing.quantity + quantity, price_snapshot_minor: price }).eq("id", existing.id);
  }

  return supabase.from("cart_items").insert({ cart_id: cart.id, variant_id: variantId, quantity, price_snapshot_minor: price });
}

export async function updateCartItem(itemId: string, quantity: number) {
  const supabase = createSupabaseAdminClient();
  if (quantity <= 0) return supabase.from("cart_items").delete().eq("id", itemId);
  return supabase.from("cart_items").update({ quantity }).eq("id", itemId);
}

export async function removeCartItem(itemId: string) {
  const supabase = createSupabaseAdminClient();
  return supabase.from("cart_items").delete().eq("id", itemId);
}
