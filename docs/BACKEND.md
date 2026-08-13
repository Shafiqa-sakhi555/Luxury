# Backend README — Jalal's Home Solution

This document describes **what the backend currently does**, **which databases it uses**, and **which functions power each area**. It is a read-only map of the existing code. No new features are described here as planned work.

Stack: **Next.js 15 App Router**, **TypeScript**, **Prisma 7** (PostgreSQL), **Supabase** (optional catalog), **Auth.js v5** (credentials + JWT).

Money is stored in **integer minor units (paisa)** in Prisma. Supabase catalog prices are **major units (PKR rupees)** and converted with `pkrToMinor()` / `toMinor()`.

---

## 1. Two databases

The backend is a **dual-database** system. Login, cart, checkout, orders, RBAC, and most catalog writes live in **Prisma Postgres**. Three product categories live in **Supabase** and are mirrored into Prisma so cart/checkout still work.

| Database | Connection | Role |
|----------|------------|------|
| **Prisma PostgreSQL** | `DATABASE_URL` (local `npm run db:dev`, typically `localhost:51214`) | System of record: users, roles, customers, cart, orders, inventory ledger, Prisma catalog, stores, audit logs |
| **Supabase PostgreSQL** | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (+ `SUPABASE_SERVICE_ROLE_KEY` for admin writes) | Catalog source of truth for **curtains**, **prayer-mats**, **carpets** |

If Supabase env vars are missing, `isSupabaseConfigured()` returns `false` and the shop uses **Prisma only**.

### How they are stitched

Supabase products cannot go into `/api/cart` directly. Cart items require a Prisma `ProductVariant.id`.

On product detail (and after admin create/update of a Supabase product), the backend **upserts a Prisma Product + ProductVariant keyed by SKU**, storing the Supabase UUID in `Product.externalCisId`. Sync is **one-way: Supabase → Prisma**.

Owned slugs (`src/lib/supabase/catalog-categories.ts`):

```
curtains, prayer-mats, carpets
```

Legacy alias: `carpet` → `carpets`.

---

## 2. Prisma database (system of record)

**Schema:** `prisma/schema.prisma`  
**Client:** `src/server/db.ts` → exported `db` (PrismaClient + `@prisma/adapter-pg`)  
**Seed:** `prisma/seed.ts`  
**Migration:** `prisma/migrations/20260807094413_init`

### Connection (`src/server/db.ts`)

- Reads `DATABASE_URL`
- Dev pool size `1`, production `10`
- Global singleton so Next.js HMR does not open extra connections

### Prisma models (tables)

**Identity / Auth.js**

| Model | Purpose |
|-------|---------|
| `User` | Email, `passwordHash`, `isActive` |
| `Account` | OAuth-style accounts (Auth.js adapter) |
| `Session` | Database sessions (adapter table; app uses JWT) |
| `VerificationToken` | Auth.js verification tokens |

**RBAC**

| Model | Purpose |
|-------|---------|
| `Role` | Named roles (`Super Admin`, `Customer`, …) |
| `Permission` | String keys (`product.write`, `*`, …) |
| `RolePermission` | Role ↔ permission |
| `UserRole` | User ↔ role |

**Customer**

| Model | Purpose |
|-------|---------|
| `Customer` | 1:1 with `User`; phone, preferred store |
| `Address` | Shipping/billing addresses |
| `CustomerNote` | Staff notes |
| `CustomerTag` | Tags |

**Catalog (Prisma)**

| Model | Purpose |
|-------|---------|
| `Category` | Tree (`parentId`), slug, status |
| `Brand` | Product brand |
| `Collection` | Merchandising collections |
| `Product` | Parent product (slug, type, status) |
| `ProductVariant` | SKU, prices in paisa, unique `sku` |
| `ProductMedia` | Images / video / 3D |
| `ProductCollection` | Product ↔ collection |
| `ProductRelation` | Related / similar / bought-together |
| `AttributeDefinition` | Category-level attributes |
| `AttributeOption` | Enum options |
| `VariantAttributeValue` | Variant attribute values |

**Stores / stock**

| Model | Purpose |
|-------|---------|
| `Store` | Physical branches (`StoreBrand`) |
| `ProductStoreAvailability` | Per-store availability flag |
| `InventoryBalance` | onHand / reserved / damaged / returned |
| `StockMovement` | Stock ledger (types exist; checkout does not write them yet) |

**Commerce**

| Model | Purpose |
|-------|---------|
| `Cart` | One per customer **or** guest cookie token |
| `CartItem` | Unique `(cartId, variantId)`; `priceSnapshotMinor` |
| `Order` | Order number, COD, shipping columns, totals |
| `OrderItem` | Denormalized line (name, SKU, unit price) |
| `OrderStatusHistory` | Status transitions |
| `Quotation` | Quote requests (schema only) |
| `Wishlist` / `WishlistItem` | Wishlist (created on register; no storefront UI) |
| `Review` | Product reviews (schema only) |

**Content / ops**

| Model | Purpose |
|-------|---------|
| `ContentPage` | CMS pages |
| `JournalPost` | Journal posts |
| `Inquiry` | Contact inquiries |
| `AuditLog` | Admin mutation audit |
| `ImportRun` / `ImportRunError` | CSV import runs |

### Important enums

- `PublicationStatus`: `DRAFT` | `ACTIVE` | `ARCHIVED`
- `ProductType`: `SIMPLE` | `VARIANT` | `MADE_TO_MEASURE` | `CONFIGURABLE`
- `OrderStatus`: `PENDING` → `CONFIRMED` → `PROCESSING` → `PACKED` → `SHIPPED` → `DELIVERED` (also `CANCELLED`, `RETURNED`, `REFUNDED`)
- `PaymentMethod`: `COD` | `ONLINE` (checkout always uses COD)
- `FulfilmentType`: `DELIVERY` | `BRANCH_PICKUP`

---

## 3. Supabase database (catalog for 3 categories)

**Migrations:**

- `supabase/migrations/001_catalog_schema.sql`
- `supabase/migrations/002_product_variants.sql`

### Tables (`public` schema)

| Table | Purpose |
|-------|---------|
| `categories` | `name`, `slug`, `is_active` |
| `products` | Prices as `numeric` PKR, `sku`, `has_variants`, merchandising fields (`size`, `fabric`, `design`, `selling_unit`) |
| `product_images` | URLs; optional `variant_id` |
| `product_specifications` | Key/value specs |
| `inventory` | Product-level stock |
| `product_variants` | Collection variants (carpets) |
| `product_variant_inventory` | Variant stock |

RLS is enabled with **public SELECT** on active rows. Writes use the **service role** client (`createSupabaseAdminClient()`), which bypasses RLS.

Storage bucket: `product-images` (public read).

---

## 4. Backend layout

```
src/server/
  db.ts                          Prisma client
  rbac.ts                        Permissions
  audit/index.ts                 Audit log + dashboard stats
  cart/index.ts                  Cart
  orders/index.ts                Checkout + order queries
  catalog/
    products.ts                  Public catalog merge (Prisma + Supabase)
    supabase-products.ts         Supabase catalog reads
    supabase-sync.ts             Supabase → Prisma variant sync
    admin-queries.ts             Admin product reads (merged)
    admin-mutations.ts           Prisma product CRUD
    admin-supabase-mutations.ts  Supabase product CRUD + sync
    admin-actions.ts             Server actions for products
    admin-category-mutations.ts  Prisma category CRUD
    admin-category-actions.ts    Server actions for categories

src/lib/auth.ts                  Auth.js (credentials + JWT)
src/lib/auth.config.ts           Edge-safe Auth.js config (middleware)
src/middleware.ts                Protects /admin and /account

src/app/api/
  auth/[...nextauth]/route.ts    Auth.js handlers
  auth/register/route.ts         Customer registration
  cart/route.ts                  Cart HTTP API
  checkout/route.ts              Place order
```

---

## 5. Functions by module

### 5.1 Database client — `src/server/db.ts`

| Export | What it does |
|--------|----------------|
| `db` | Shared PrismaClient |

---

### 5.2 Auth — `src/lib/auth.ts`, `src/lib/auth.config.ts`, `src/middleware.ts`

| Export / piece | What it does |
|----------------|----------------|
| `handlers` | GET/POST for `/api/auth/[...nextauth]` |
| `auth()` | Read current session (server) |
| `signIn` / `signOut` | Auth.js helpers |
| `authorize(credentials)` | Look up `User` by email, bcrypt-compare password, reject inactive users |
| JWT callback | On login, stamp `permissions` and `isStaff` (any role except `"Customer"`) |
| Session | JWT, 8-hour `maxAge` |
| Middleware | Unauthenticated `/admin` and `/account` → `/login`; `/admin` also requires `isStaff` |

Seeded admin (after `npm run db:setup`): `admin@jalalsgroup.com` / `Admin123!`

---

### 5.3 RBAC — `src/server/rbac.ts`

| Function | What it does |
|----------|----------------|
| `getUserPermissions(userId)` | Load permission keys via UserRole → Role → RolePermission |
| `hasPermission(userId, key)` | True if `*` or exact key |
| `requirePermission(key)` | Require session + permission; throws `AuthorizationError` |
| `requireAuth()` | Require session only |
| `isStaff(userId)` | True if any role is not named `Customer` |

**Enforced today:** `product.write`, `product.delete` (product mutations), `category.write` (category mutations).  
**Seeded but not enforced on reads:** `dashboard.view`, `product.view`, `order.view`, `order.status`, `inventory.view`, `customer.view`, `audit.view`, `settings.write`, etc.

---

### 5.4 Public catalog — `src/server/catalog/products.ts`

This is the merge layer used by `/shop`, `/categories/[slug]`, `/products/[slug]`.

| Function | Database | What it does |
|----------|----------|----------------|
| `listProducts(params)` | Both | List products. If slug is a Supabase category → Supabase (Prisma fallback). If no category → merge both catalogs then paginate. Otherwise Prisma. Parent categories include **child-category products** (e.g. Furniture includes Sofa/Beds). |
| `getProductBySlug(slug, admin?)` | Both | Try Supabase first (storefront), then Prisma. PDP syncs a Prisma variant for simple Supabase products. |
| `getRelatedProducts(slug, categorySlug)` | Both | Up to 4 products in the same category |
| `listShopFilterCategories()` | Both | Filter pills for `/shop` |
| `listCategories(includeDraft?)` | Prisma | Category tree + product counts (used by admin categories) |
| `getCategoryBySlug(slug)` | Both | Category metadata |
| `listBrands()` | Prisma | Active brands |
| `adminListProducts(params)` | Prisma | Older Prisma-only admin list (admin UI uses `adminListAllProducts` instead) |

Internal helpers: `fetchPrismaProducts`, `mapPrismaProduct`, `categoryFilterWhere`, `prismaExcludesSupabaseCategories`.

---

### 5.5 Supabase catalog reads — `src/server/catalog/supabase-products.ts`

| Function | What it does |
|----------|----------------|
| `listSupabaseProductsByCategorySlug(slug, params)` | Paged list for a category. Uses a **lean** select for grids (one image, no specs). Batch-resolves Prisma variant IDs by SKU. |
| `getSupabaseProductBySlug(slug)` | Full product for PDP (gallery, specs, variants). May sync Prisma variant. |
| `getSupabaseCategoryBySlug(slug)` | Category row |
| `isSupabaseCategorySlug(slug)` | Local check against `SUPABASE_CATALOG_SLUGS` (no network) |
| `countSupabaseProductsInCategory(slug)` | Head count query |
| `mapSupabaseProduct(row, withVariant?)` | Map full row → `CatalogProduct` |
| `batchResolvePrismaVariantIds(skus)` | One Prisma `findMany` for many SKUs |

Clients:

- Storefront reads: `createSupabaseServerClient()` (anon key + RLS)
- Admin writes: `createSupabaseAdminClient()` (service role)

---

### 5.6 Supabase → Prisma sync — `src/server/catalog/supabase-sync.ts`

| Function | What it does |
|----------|----------------|
| `syncPrismaVariantForSupabaseProduct(input)` | Upsert Prisma Category + Product + Media + Variant by SKU |
| `syncPrismaCarpetCollection(input)` | Same for multi-variant collections |
| `syncPrismaVariantForSupabaseVariant(input)` | Alias of the simple-product sync |
| `getSupabaseSlugByPrismaProductId(id)` | Lookup via `externalCisId` |

---

### 5.7 Cart — `src/server/cart/index.ts`

Uses **Prisma only**. Cookie: `jalals_cart_token` (httpOnly, 30 days).

| Function | What it does |
|----------|----------------|
| `getCartToken()` | Read or create guest cart cookie |
| `getOrCreateCart(customerId?)` | Customer cart **or** guest cart by token |
| `addToCart(variantId, qty, customerId?)` | Require active variant + ACTIVE product; snapshot price |
| `updateCartItem(itemId, quantity)` | Update qty; qty ≤ 0 deletes the line |
| `removeCartItem(itemId)` | Delete line |
| `cartTotals(cart)` | Subtotal + delivery: **free at ≥ PKR 50,000**, else **PKR 2,500** |

HTTP: `src/app/api/cart/route.ts`

| Method | Function called |
|--------|-----------------|
| GET | `getOrCreateCart` + `cartTotals` |
| POST | `addToCart` |
| PATCH | `updateCartItem` |
| DELETE | `removeCartItem` |

---

### 5.8 Orders — `src/server/orders/index.ts`

Uses **Prisma only**. Checkout is **COD**. Inventory is **not** decremented on place-order.

| Function | What it does |
|----------|----------------|
| `placeOrder(input)` | Transaction: copy cart → Order + OrderItems + StatusHistory (`PENDING`), then clear cart items. Order number: `JHS-YYMMDD-XXXXXX`. |
| `listCustomerOrders(customerId)` | Customer order history |
| `getOrderByNumber(orderNumber, customerId?)` | Confirmation / account detail |
| `adminListOrders({ page, status, search })` | Admin list (page size 25) |
| `updateOrderStatus(orderId, toStatus, actorId, reason?)` | Validated status machine — **implemented, not wired to admin UI** |

HTTP: `src/app/api/checkout/route.ts` → requires session + Customer row → `placeOrder`.

---

### 5.9 Admin product queries — `src/server/catalog/admin-queries.ts`

| Function | Database | What it does |
|----------|----------|----------------|
| `parseImageUrlsFromText` / `imageUrlsToText` | — | Newline-separated image URLs |
| `adminGetCatalogProductCounts()` | Both | Dashboard product counts |
| `adminListAllProducts(params)` | Both | Merged admin product list (in-memory merge + page slice) |
| `adminListCategoryOptions()` | Both | Category dropdown for product form |
| `adminGetProduct(id, source)` | Branch | Edit-form payload |
| `adminGetDefaultStoreId()` | Prisma | First store (inventory upsert target) |

---

### 5.10 Admin product mutations

**Prisma** — `src/server/catalog/admin-mutations.ts`  
Permission: `product.write` / `product.delete`

| Function | What it does |
|----------|----------------|
| `createPrismaProduct` | Product + default variant + media + inventory + audit |
| `updatePrismaProduct` | Update product / first variant / media / stock |
| `archivePrismaProduct` | Status `ARCHIVED`, variants inactive |
| `deletePrismaProduct` | Hard delete if no order items; otherwise archive |

**Supabase** — `src/server/catalog/admin-supabase-mutations.ts`  
Same permissions; then `syncSupabaseProductToPrisma`.

| Function | What it does |
|----------|----------------|
| `createSupabaseCatalogProduct` | Insert product, images, inventory; sync Prisma |
| `updateSupabaseCatalogProduct` | Update + re-sync |
| `archiveSupabaseCatalogProduct` | `is_active = false` |
| `deleteSupabaseCatalogProduct` | Always archives (no hard delete) |

**Server actions** — `src/server/catalog/admin-actions.ts`

| Action | Routes to |
|--------|-----------|
| `saveProductAction` | Prisma or Supabase create/update by `values.source` |
| `removeProductAction` | Delete/archive by source |
| `archiveProductAction` | Archive by source (exported; unused by UI) |

---

### 5.11 Admin category CRUD (Prisma)

**Mutations** — `src/server/catalog/admin-category-mutations.ts`  
Permission: `category.write`

| Function | What it does |
|----------|----------------|
| `createPrismaCategory` | Create with unique slug, optional parent, audit |
| `updatePrismaCategory` | Update; blocks invalid parent (self, grandchild, nested parent) |
| `deletePrismaCategory` | Delete if empty; **archive** if it has products; refuse if it has children |

**Server actions** — `src/server/catalog/admin-category-actions.ts`

| Action | What it does |
|--------|----------------|
| `saveCategoryAction` | Zod-validate then create or update |
| `removeCategoryAction` | Delete or archive |

UI: `src/components/admin/catalog/CategoryManager.tsx` on `/admin/catalog/categories`.  
Supabase categories are **not** managed here (Prisma tree only).

---

### 5.12 Audit / dashboard — `src/server/audit/index.ts`

| Function | What it does |
|----------|----------------|
| `writeAuditLog(input)` | Insert `AuditLog` |
| `getDashboardSummary()` | Order counts, customers, low stock (`onHand ≤ 5`), recent orders, revenue (CONFIRMED→DELIVERED), product counts |

---

### 5.13 Registration — `src/app/api/auth/register/route.ts`

`POST` with Zod (`name`, `email`, password min 8):

1. Reject duplicate email (409)
2. Upsert `Customer` role
3. bcrypt hash (cost 12)
4. Create `User` + `UserRole` + `Customer` + empty `Wishlist`

Does **not** auto sign-in.

---

### 5.14 Supabase helpers — `src/lib/supabase/`

| Function | File | What it does |
|----------|------|----------------|
| `getSupabaseUrl` / `getSupabaseAnonKey` / `getSupabaseServiceRoleKey` | `env.ts` | Read env (throw if missing) |
| `isSupabaseConfigured()` | `env.ts` | True if public URL + anon key exist |
| `createSupabaseServerClient()` | `server.ts` | Cookie-aware SSR client |
| `createSupabaseAdminClient()` | `admin.ts` | Service-role client (server only) |
| `createSupabaseBrowserClient()` | `client.ts` | Browser client (not used by storefront) |
| `normalizeCategorySlug` / `isSupabaseCatalogSlug` / `formatCategoryLabel` | `catalog-categories.ts` | Slug routing |

---

### 5.15 Shared utilities used by the backend

| Function | File | What it does |
|----------|------|----------------|
| `formatMoney` / `toMinor` / `toMajor` / `effectivePriceMinor` | `src/lib/money.ts` | Paisa ↔ PKR |
| `slugify` / `uniqueProductSlug` | `src/lib/slug.ts` | URL slugs (products and categories) |

---

## 6. HTTP API (complete list)

| Route | Methods | Backend functions |
|-------|---------|-------------------|
| `/api/auth/[...nextauth]` | GET, POST | Auth.js `handlers` |
| `/api/auth/register` | POST | Prisma `user.create` (nested customer + wishlist) |
| `/api/cart` | GET, POST, PATCH, DELETE | `getOrCreateCart`, `addToCart`, `updateCartItem`, `removeCartItem` |
| `/api/checkout` | POST | `getOrCreateCart`, `placeOrder` |

Everything else is **Server Components** or **Server Actions** (no extra REST API).

---

## 7. End-to-end backend flows

### Browse catalog

```
/shop or /categories/[slug]
  → listProducts()
      → Supabase category?  listSupabaseProductsByCategorySlug()
      → Prisma category?    fetchPrismaProducts()  (includes child slugs)
      → no filter?          merge both, then paginate
/products/[slug]
  → getProductBySlug()
      → Supabase hit → mapSupabaseProduct() → syncPrismaVariantForSupabaseProduct()
      → else Prisma Product + first active variant
```

### Cart → order

```
POST /api/cart { variantId }
  → addToCart() → Prisma CartItem (price snapshot)

POST /api/checkout { shipping, fulfilmentType }
  → auth() + Customer
  → placeOrder() in a Prisma transaction
  → Order PENDING, COD, cart items deleted
```

### Admin product save

```
ProductForm → saveProductAction()
  → source === "supabase" ? create/updateSupabaseCatalogProduct()
  → else create/updatePrismaProduct()
  → writeAuditLog() + revalidatePath(/shop, admin list)
```

### Admin category save

```
CategoryManager → saveCategoryAction()
  → Zod parse → createPrismaCategory() or updatePrismaCategory()
  → writeAuditLog() + revalidatePath(/admin/catalog/categories, /shop)
```

---

## 8. What is implemented vs schema-only

| Area | Status |
|------|--------|
| Auth (register, login, JWT, middleware) | Implemented |
| Public catalog (Prisma + optional Supabase) | Implemented |
| Cart + COD checkout | Implemented |
| Customer order list / confirmation | Implemented |
| Admin product CRUD (both DBs) | Implemented |
| Admin category CRUD (Prisma) | Implemented |
| Admin dashboard aggregates | Implemented |
| Admin order list | Implemented (list only) |
| Order status transitions | Function exists; **no admin UI** |
| Inventory decrement on sale | **Not implemented** (`StockMovement` unused at checkout) |
| Admin inventory page | Placeholder UI |
| Wishlist / reviews / quotations / inquiries | Tables exist; little or no UI |
| Online payment | Enum exists; checkout is COD only |
| Branch pickup | Schema + API field; checkout form always sends `DELIVERY` |

---

## 9. Local setup (backend)

Two terminals:

```bash
# Terminal 1 — Prisma Postgres (leave running)
npm run db:dev

# Terminal 2 — migrate, seed, app
npm run db:setup    # prisma migrate + seed (creates admin user)
npm run dev
```

`.env` must include `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`.  
Supabase vars are optional; without them the shop is Prisma-only.

Auth users live in **Prisma** (`"User"` table), not in the Supabase SQL editor. Supabase has `categories` / `products`, not `"User"`.
