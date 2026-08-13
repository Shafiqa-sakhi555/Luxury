# Module 1: Remove Prisma and Convert Backend to Supabase Only

This document provides the complete, production-ready architecture and code to migrate the dual-database setup to a single Supabase instance.

## 1. Supabase SQL Schema

Run this in your Supabase SQL Editor to create the missing tables and alter existing catalog tables to support the full Prisma feature set.

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. AUTHENTICATION & RBAC
-- ==========================================
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE public.role_permissions (
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE public.user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- ==========================================
-- 2. PROFILES & CUSTOMERS
-- ==========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, image_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'image_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone TEXT,
  preferred_store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  marketing_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Home',
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  region TEXT,
  postal_code TEXT,
  phone TEXT,
  is_default_shipping BOOLEAN DEFAULT false,
  is_default_billing BOOLEAN DEFAULT false
);

-- ==========================================
-- 3. CATALOG UPDATES (Altering existing tables)
-- ==========================================
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'SIMPLE';

-- Convert original_price and sale_price to minor units (integer) to match Prisma logic
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS original_price_minor INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sale_price_minor INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS price_minor INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sale_price_minor INTEGER NOT NULL DEFAULT 0;

-- ==========================================
-- 4. INVENTORY MOVEMENTS
-- ==========================================
CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'RECEIVE', 'SALE', 'ADJUSTMENT'
  delta INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason TEXT,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 5. CARTS
-- ==========================================
CREATE TABLE public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID UNIQUE REFERENCES public.customers(id) ON DELETE CASCADE,
  token TEXT UNIQUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES public.carts(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  customization JSONB,
  price_snapshot_minor INTEGER,
  UNIQUE(cart_id, variant_id)
);

-- ==========================================
-- 6. ORDERS
-- ==========================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  payment_method TEXT NOT NULL DEFAULT 'COD',
  payment_status TEXT NOT NULL DEFAULT 'PENDING',
  fulfilment_type TEXT NOT NULL DEFAULT 'DELIVERY',
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  subtotal_minor INTEGER NOT NULL,
  discount_minor INTEGER NOT NULL DEFAULT 0,
  delivery_minor INTEGER NOT NULL DEFAULT 0,
  tax_minor INTEGER NOT NULL DEFAULT 0,
  total_minor INTEGER NOT NULL,
  shipping_name TEXT,
  shipping_line1 TEXT,
  shipping_line2 TEXT,
  shipping_city TEXT,
  shipping_region TEXT,
  shipping_postal TEXT,
  shipping_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant_sku TEXT NOT NULL,
  variant_name TEXT,
  image_url TEXT,
  unit_price_minor INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  line_total_minor INTEGER NOT NULL,
  customization JSONB
);

CREATE TABLE public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 7. AUDIT LOGS
-- ==========================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before JSONB,
  after JSONB,
  reason TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 2. RLS Policies

```sql
-- Enable RLS on all new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Customers: Users can read/update their own customer record
CREATE POLICY "Users can view own customer record" ON public.customers FOR SELECT USING (
  profile_id = auth.uid()
);

-- Carts: Users can manage their own cart. Guests use service_role via API.
CREATE POLICY "Users can manage own cart" ON public.carts FOR ALL USING (
  customer_id IN (SELECT id FROM public.customers WHERE profile_id = auth.uid())
);

CREATE POLICY "Users can manage own cart items" ON public.cart_items FOR ALL USING (
  cart_id IN (
    SELECT id FROM public.carts WHERE customer_id IN (
      SELECT id FROM public.customers WHERE profile_id = auth.uid()
    )
  )
);

-- Orders: Users can view their own orders
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (
  customer_id IN (SELECT id FROM public.customers WHERE profile_id = auth.uid())
);

CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  order_id IN (
    SELECT id FROM public.orders WHERE customer_id IN (
      SELECT id FROM public.customers WHERE profile_id = auth.uid()
    )
  )
);

-- Note: Admin operations will use the service_role key, bypassing RLS.
```

## 3. TypeScript Database Types

Generate the types using the Supabase CLI:
```bash
npx supabase gen types typescript --project-id your-project-id > src/types/supabase.ts
```

## 4. Refactored Services

### `src/server/cart/index.ts`
```typescript
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
```

### `src/server/orders/index.ts`
```typescript
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PlaceOrderInput } from "./types"; // Define types accordingly

export async function placeOrder(input: PlaceOrderInput) {
  const supabase = createSupabaseAdminClient();
  
  // 1. Fetch Cart
  const { data: cart } = await supabase.from("carts").select("*, cart_items(*, product_variants(*, products(*, product_images(*))))").eq("id", input.cartId).single();
  if (!cart || cart.cart_items.length === 0) throw new Error("Cart is empty");

  // 2. Calculate Totals
  let subtotalMinor = 0;
  for (const item of cart.cart_items) {
    const price = item.price_snapshot_minor ?? item.product_variants.price_minor;
    subtotalMinor += price * item.quantity;
  }
  const deliveryMinor = subtotalMinor >= 5_000_000 ? 0 : 250_000;
  const totalMinor = subtotalMinor + deliveryMinor;

  // 3. Create Order
  const orderNumber = `JHS-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  
  const { data: order, error: orderError } = await supabase.from("orders").insert({
    order_number: orderNumber,
    customer_id: input.customerId,
    status: "PENDING",
    payment_method: input.paymentMethod ?? "COD",
    fulfilment_type: input.fulfilmentType,
    subtotal_minor: subtotalMinor,
    delivery_minor: deliveryMinor,
    total_minor: totalMinor,
    shipping_name: input.shipping.name,
    shipping_line1: input.shipping.line1,
    shipping_city: input.shipping.city,
    shipping_phone: input.shipping.phone,
    notes: input.notes,
  }).select().single();

  if (orderError) throw new Error(orderError.message);

  // 4. Create Order Items
  const orderItems = cart.cart_items.map(item => ({
    order_id: order.id,
    variant_id: item.variant_id,
    product_name: item.product_variants.products.name,
    variant_sku: item.product_variants.sku,
    unit_price_minor: item.price_snapshot_minor ?? item.product_variants.price_minor,
    quantity: item.quantity,
    line_total_minor: (item.price_snapshot_minor ?? item.product_variants.price_minor) * item.quantity
  }));

  await supabase.from("order_items").insert(orderItems);
  await supabase.from("order_status_history").insert({ order_id: order.id, to_status: "PENDING", reason: "Order placed" });
  await supabase.from("cart_items").delete().eq("cart_id", cart.id);

  return order;
}
```

## 5. Refactored Authentication

Replace Auth.js with Supabase SSR Auth.

### `src/middleware.ts`
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/account'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Admin check
  if (user && request.nextUrl.pathname.startsWith('/admin')) {
    const { data: roles } = await supabase.from('user_roles').select('roles(name)').eq('user_id', user.id);
    const isStaff = roles?.some(r => r.roles.name !== 'Customer');
    if (!isStaff) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*'],
}
```

## 6. Migration Strategy

1. **Database Setup**: Run the SQL schema in the Supabase SQL Editor.
2. **Data Migration**: Export data from local Prisma Postgres to CSV. Import CSVs into Supabase tables in order of dependencies (Profiles -> Customers -> Categories -> Products -> Variants -> Carts -> Orders).
3. **Code Replacement**: 
   - Delete the `prisma` folder.
   - Delete `src/server/db.ts`.
   - Replace all `db.model.query` calls with `supabase.from('model').query`.
4. **Auth Migration**: Update login/register forms to use `supabase.auth.signInWithPassword` and `supabase.auth.signUp`.
5. **Environment Variables**: Remove `DATABASE_URL`, `AUTH_SECRET`. Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set.
6. **Package Cleanup**: `npm uninstall prisma @prisma/client @prisma/adapter-pg next-auth bcryptjs`

## 7. Folder Structure

```
src/
  app/
    (auth)/           # Supabase Auth UI
    (storefront)/     # Public pages
    (checkout)/       # Checkout flow
    (admin)/          # Admin dashboard
  components/         # UI components
  lib/
    supabase/         # Supabase clients (server, browser, admin)
  server/
    cart/             # Supabase cart logic
    orders/           # Supabase order logic
    catalog/          # Supabase catalog logic
    audit/            # Supabase audit logs
```

## 8. Files to Remove

- `prisma/schema.prisma`
- `prisma/seed.ts`
- `prisma/migrations/*`
- `src/server/db.ts`
- `src/lib/auth.ts`
- `src/lib/auth.config.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/server/catalog/admin-mutations.ts`
- `src/server/catalog/admin-category-mutations.ts`
- `src/server/catalog/supabase-sync.ts`

## 9. Files to Update

- `package.json` (Remove Prisma/Auth.js dependencies)
- `src/middleware.ts` (Update to Supabase SSR)
- `src/app/(auth)/login/LoginForm.tsx` (Use Supabase Auth)
- `src/app/(auth)/register/page.tsx` (Use Supabase Auth)
- `src/server/rbac.ts` (Query Supabase for roles)
- `src/server/cart/index.ts` (Query Supabase)
- `src/server/orders/index.ts` (Query Supabase)
- `src/server/catalog/products.ts` (Remove Prisma fallback, use Supabase entirely)
- `src/server/catalog/admin-queries.ts` (Query Supabase)
- `src/server/audit/index.ts` (Query Supabase)
- `src/app/api/cart/route.ts` (Update auth check)
- `src/app/api/checkout/route.ts` (Update auth check)
