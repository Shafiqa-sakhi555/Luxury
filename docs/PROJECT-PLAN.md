# Jalal's Home Solutions -- Build Plan & Technical Direction

**Version:** 1.0
**Date:** August 3, 2026
**Scope of this document:** Website phases only. CIS, POS, finance dashboards and the AI visualizer are planned here but deliberately scheduled after launch.
**Reference site:** [vsurfaces.com](https://www.vsurfaces.com/)

---

## 1. The most important finding

I analysed vsurfaces.com's actual structure through its sitemap rather than its homepage. It is a **Shopify store with about 110 "collections."** Those collections are not 110 categories. They break down like this:

| What it really is | Count | Examples |
|---|---|---|
| Genuine product categories | ~36 | `rugs`, `flooring`, `sofas`, `prayer-mats-janamaz`, `bed`, `recliners`, `mirrors` |
| Style facets | ~16 | `shaggies`, `khaddi-rugs`, `boucle`, `vintage-rugs`, `printed-rugs`, `handmade` |
| Size facets | ~11 | `2-x-4-ft`, `5-x-8-ft`, `8-x-11-ft`, `10-x-13-ft`, `shop-by-size` |
| Colour facets | ~12 | `beige`, `black`, `brown`, `gray`, `green`, `cream`, `multi-colors` |
| Price facets | 6 | `under-5k`, `under-20k`, `above-100k` |
| Internal workarounds leaking publicly | ~8 | `0-stock-products`, `hide-price`, `reelup-do-not-delete`, `wd-custom`, `rugs-price-check` |

**Why this matters.** Shopify cannot express category-specific attributes. A rug needs size, weave, pile height and shape; a laminate needs thickness, wear layer and coverage per box. Shopify has only three generic option slots. So the vsurfaces team was forced to hand-build a collection for every size, every colour and every price band -- and when they needed operational states, those became public URLs too (`hide-price`, `0-stock-products`).

Every time they add a rug size, somebody creates a collection by hand and re-tags products. At 1,000+ products that is permanent, unpaid maintenance work.

**This is the gap we exploit.** If we build real categories plus a typed attribute system plus faceted filtering, then all 110 of those collections become URLs that generate themselves:

```
/rugs?size=5x8&colour=beige&max=20000
/flooring?material=lvt&thickness=8mm
```

No manual tagging. No duplicate collections. Filters composable in any combination, each one crawlable and shareable. **We beat them on information architecture, not on animation.** Animation is the easy part and we already have it.

---

## 2. Brand direction

The client logo is a white circular badge: snow-capped mountains in a blue-to-cyan gradient, "Jalal's" in deep navy with a red `J`, and a violet-to-blue ring sweep.

### Palette extracted from the logo

| Token | Hex | Role |
|---|---|---|
| `navy` | `#241C6B` | Primary brand, headings, dark surfaces |
| `red` | `#EE1C25` | Primary CTA, sale badges, the accent that makes the logo pop |
| `violet` | `#5B2FD6` | Gradient start, secondary accent |
| `blue` | `#3B6FE0` | Gradient mid |
| `cyan` | `#29C4E8` | Gradient end, highlights, hover states |
| `white` | `#FFFFFF` | Primary background |
| `mist` | `#F7F9FC` | Section background, cards |
| `slate` | `#C9CDD6` | Borders, muted text |

Signature gradient: `violet -> blue -> cyan`, taken straight from the logo ring and mountains.

### The honest problem

The current codebase is a **dark theme**: `midnight #0C1929` backgrounds with `gold #F59E0B` accents. **There is no gold anywhere in this logo, and the logo is light, not dark.** The existing palette and the client's brand do not match.

This needs resolving in Phase 0, before we build another fifteen pages in the wrong colours. Retiring the gold and moving to a light, navy-and-red identity on white is roughly a week of focused work. Doing it later means repainting every page we will have built by then.

I recommend a **light theme** -- white and mist backgrounds, navy text, red CTAs, violet-cyan gradients for hero and feature moments. It matches the logo, and it is also correct commercially: home furnishings retail is a light, airy, photography-led category. Dark themes hide product photography, and product photography is what sells rugs.

---

## 3. Recommended stack

Sized for **1,000+ products across 13 categories, roughly 8,000-15,000 variants** once sizes and colours multiply out.

| Layer | Choice | Reasoning |
|---|---|---|
| Framework | **Next.js 15 App Router + React 19 + TypeScript** | Already in the repo. Server-rendered category and product pages are non-negotiable for SEO on a 1,000-product catalog. |
| Styling | **Tailwind CSS v4** | Already in the repo. Drive it from CSS custom properties so the rebrand is a token change, not a find-and-replace. |
| Database | **PostgreSQL** | The only correct answer. Relational integrity for orders, variants and stock; strong JSON support for flexible attributes; excellent full-text search built in. |
| ORM | **Prisma** | Typed schema, real migrations, good error messages. Drizzle is faster but less forgiving while you are learning. |
| Backend | **Next.js Route Handlers + Server Actions**, with all logic in an isolated `src/server/` domain layer | See section 4. One app, one deploy, one language, shared types for free. |
| Search | **PostgreSQL full-text + `pg_trgm`** | 1,000 products is small. Meilisearch and Typesense are premature -- add one only when you can point at a measured problem. |
| Images | **Cloudinary** behind a swappable storage adapter | 1,000 products x 4 images ~ 4,000 files. Cloudinary gives automatic WebP/AVIF, on-the-fly resizing and a free tier that fits. Keep it behind an adapter so R2 or S3 is a later swap, not a rewrite. |
| Auth | **Auth.js v5 (NextAuth)** | Free, roles live in your own database, which matters when RBAC arrives for branch managers and finance. |
| Hosting | **Vercel** (app) + **Neon** or **Supabase** (Postgres) | Zero DevOps. Preview deploys per pull request. Neon's database branching gives you a real staging environment for free. |
| CI | **GitHub Actions** -- lint, typecheck, build, migration check | Cheap to set up, prevents the broken-main problem. |
| Animation | **Framer Motion** (UI) + **GSAP ScrollTrigger** (scroll) + **Lenis** (smooth scroll) | Already in the repo and genuinely good. Keep. |
| 3D | **Three.js / React Three Fiber**, lazy-loaded on the product viewer only | Already installed. See the warning in section 6. |

### Deliberately deferred

**Redis.** Every one of your planning documents specifies it. You do not need it yet. Next.js caching plus Postgres covers Phase 1 through 4 comfortably. Add Redis when you have real queue work (email jobs, image processing, CIS sync) or measured cache pressure -- realistically around the CIS phase.

**NestJS as a separate API.** Justified when POS terminals and CIS sync need an API that is not the website. That is months away. See section 4 for how we stay ready for it.

**Meilisearch, Kubernetes, microservices, a monorepo.** All premature. Your own roadmap document says the same thing under "What Not to Build First," and it is right.

### Rough monthly cost

Vercel Hobby (free) or Pro ($20) - Neon free tier or Launch ($19) - Cloudinary free tier. **Realistically $0 during development, $20-45/month once live.** Compare that to the Hostinger VPS in your enterprise SRS, which is cheaper on paper but means you personally own TLS certificates, nginx config, database backups, and 3am outages.

---

## 4. Architecture decision: one app, with a seam

Your roadmap document recommends a separate NestJS backend. I am recommending against it *for now*, and I want to be explicit about the trade-off so the decision is yours with open eyes.

**Adding NestJS today costs you:** two dev servers, two deploys, CORS configuration, auth token plumbing between apps, duplicated types or a shared package to maintain, and the loss of React Server Components fetching data directly.

**It buys you today:** nothing. The website has no consumer other than the website.

**So:** build Phase 1-6 as one Next.js application, but enforce one rule that keeps the door open.

```
src/
|-- app/                    Routes, pages, layouts -- thin. No database access, ever.
|-- components/             Presentation only.
|-- server/                 <-- THE SEAM. All business logic lives here.
|   |-- catalog/            products, categories, attributes, variants
|   |-- content/            pages, milestones, journal, stores
|   |-- inquiry/            contact, consultation, quotation requests
|   |-- identity/           users, sessions, RBAC
|   \-- db.ts               Prisma client
\-- lib/                    Pure helpers, formatters, shared types
```

Route handlers and server actions are **thin wrappers** that validate input, call a service in `src/server/`, and shape the response. No Prisma query ever appears in a component or a page.

When CIS and POS arrive and you genuinely need a standalone API, `src/server/` lifts into a NestJS application almost as-is, because it never depended on Next.js. The seam is the insurance policy. **If you break the rule and scatter database calls through your components, you lose the option** -- so treat it as non-negotiable from the first commit.

---

## 5. The data model that makes this work

This is the part that must be right, because it is the part that is expensive to fix later. Both your requirements document and your roadmap say the same thing, and they are correct: **do not start with the homepage, start with the product data.**

### Core shape

```
Category (tree: parent_id, slug, sort_order, hero_image)
   |
   |-- AttributeDefinition   <-- per category: "Pile Height", number, mm, filterable
   |        \-- AttributeOption   <-- for enums: "Low" | "Medium" | "High"
   |
   \-- Product (name, slug, description, brand_id, collection_ids,
                status, visualizer_eligibility, external_cis_id, seo_*)
            |
            |-- ProductVariant (sku UNIQUE, price_minor, sale_price_minor,
            |                   barcode, weight, dimensions,
            |                   external_cis_variant_id, is_active)
            |        \-- VariantAttributeValue (attribute_definition_id, value)
            |
            |-- ProductMedia (url, alt, sort_order, type: image|video|model_3d)
            \-- ProductRelation (related | similar | bought_together)

Brand - Collection - Store - StoreService - ProductStoreAvailability
ContentPage - Milestone - TeamMember - JournalPost - Inquiry - Quotation
User - Role - Permission - AuditLog
```

### Non-negotiable rules

1. **Category-specific typed attributes.** Never one wide product table with a column per possible field. `AttributeDefinition` belongs to a category and declares its name, data type, unit, whether it is filterable, and whether it varies per variant. Adding "Wear Layer" to Flooring becomes a row in a table, not a migration.
2. **Every sellable variant has a unique SKU**, enforced by a database unique constraint -- not by application code, not by hope.
3. **Money as integer minor units.** `price_minor INTEGER` holding paisa. Never floating point, ever. Format at the edge for display.
4. **CIS placeholder fields from day one.** `external_cis_id` on Product and `external_cis_variant_id` on ProductVariant, nullable and unused for now. They cost nothing today and save a painful migration when CIS integration begins.
5. **Slug history table.** When a product or category slug changes, keep the old one and 301 redirect. This protects SEO, and vsurfaces has clearly never done it.
6. **Filters live in the URL.** `/rugs?size=5x8&colour=beige` must be shareable, crawlable and back-button-correct.

### Confirmed category tree (13 top-level, client-supplied)

These are the client's own 13 categories, in their own words. They stay as the 13 visible
navigation entries because that is how the showroom is organised and how customers ask for
things. Underneath, five of them nest under Furniture so that every product has exactly one
true home.

| # | Category | Slug | Parent | Sub-styles / filter facets |
|---|---|---|---|---|
| 1 | Prayer Mats | `prayer-mats` | -- | Foam, Roll, Regular, Travel; size; backrest; thickness |
| 2 | Rugs | `rugs` | -- | Modern, Classical, Shaggy, Khaddi, Boucle, Vintage, Printed; shape (rect/round/oval/runner); size |
| 3 | Carpet | `carpet` | -- | Wall-to-wall, Carpet tiles, Broadloom; pile height; material; width |
| 4 | Door Mats | `door-mats` | -- | Coir, Rubber, Microfibre, Bath, Yoga; size; personalised |
| 5 | Flooring | `flooring` | -- | LVT, Laminate, Vinyl, SPC, Artificial Grass; thickness; wear layer; coverage per box |
| 6 | Furniture | `furniture` | -- | Parent hub -- lists everything from categories 7-11 |
| 7 | Sofa | `sofa` | Furniture | Sectional, L-shape, 3+2+1, Recliner, Sofa-cum-bed, Bean bag; seats; upholstery |
| 8 | Chair | `chair` | Furniture | Dining, Accent, Office, Lounge, Stool; frame material; upholstery |
| 9 | Beds | `beds` | Furniture | Single, Double, Queen, King; headboard style; storage; frame material |
| 10 | Table | `table` | Furniture | Dining, Centre, Console, Side, Study; top material; seats; shape |
| 11 | Cupboard | `cupboard` | Furniture | Wardrobe, Sideboard, Showcase, Chest of drawers; doors; finish |
| 12 | Cushions | `cushions` | -- | Covers, Filled, Throws, Bolsters; size; fabric; filling; set quantity |
| 13 | Decor | `decor` | -- | Wall art, Mirrors, Clocks, Islamic calligraphy, Lamps, Vases, Planters, Trays |

Three decisions embedded above that need the client's yes or no:

1. **Furniture as a hub, not a rival.** As a flat sibling, Furniture competes with Sofa, Chair,
   Beds, Table and Cupboard -- staff would have to guess where a new sofa belongs, and it would
   end up in both. Making it a parent means `/furniture` is a genuinely useful "show me
   everything" page, `/sofa` is precise, and each product is filed once. The navigation still
   shows all 13 names.
2. **Rugs vs Carpet stay separate.** Treated here as different products: rugs are loose,
   finished pieces sold by the piece; carpet is broadloom or tiles sold by area and fitted. If
   the client uses the two words interchangeably, merge them now -- splitting them later is a
   migration.
3. **Curtains and Wall Panels have disappeared.** Both are absent from the client's 13, yet the
   current site hard-codes them in the navigation, the footer, the showcase filters and the hero
   search. Either the client does not sell them and every trace has to come out, or the list is
   incomplete. Worth asking before anyone builds a nav component around 13 names.

---

## 6. Customization -- the part that needs the most care

Every category has a customization option, which is the single biggest differentiator against
vsurfaces and also the single easiest way to lose money. Customization is not one feature; it
is three mechanics with different data, different pricing and different risk.

### The three mechanics

**A. Made-to-measure** -- the customer enters dimensions and the price is calculated from them.

Applies to: Rugs, Carpet, Flooring, Door Mats, and optionally Table and Cupboard.

Needs: minimum and maximum bounds per product, a price rule (per square foot, per running
foot, or per box with a wastage allowance), unit handling for a market that quotes in both feet
and metres, and a rounding policy. Made-to-measure goods are cut for one customer and cannot be
resold, so the order flow needs an explicit non-returnable acknowledgement.

**B. Configurable options** -- the customer picks from a fixed set, and choices adjust the price.

Applies to: Sofa, Chair, Beds, Table, Cupboard, Cushions.

Needs: option groups (fabric, colour, finish, configuration, storage), a price delta per option,
stock or lead-time per option, swatch imagery, and rules for combinations that are not
manufacturable. This is the classic variant matrix, and it explodes fast -- a sofa with 3
configurations, 12 fabrics and 4 leg finishes is 144 combinations, which is why these are
modelled as options with modifiers rather than as 144 pre-built variants.

**C. Personalisation** -- the customer adds text, a name, a monogram or an uploaded image.

Applies to: Prayer Mats, Door Mats, Cushions, and parts of Decor (calligraphy, name frames).

Needs: character limits, a font and placement picker, a live preview, upload validation, and a
moderation step so nothing offensive or copyrighted gets printed. Also needs a proof-approval
stage before production.

### Per-category mapping

| Category | A. Made-to-measure | B. Configurable | C. Personalised |
|---|---|---|---|
| Prayer Mats | size only | -- | name, embroidery |
| Rugs | yes -- W x L, shape, border | pile, colourway | -- |
| Carpet | yes -- room dimensions, fitting | underlay, binding | -- |
| Door Mats | yes -- size | material | text, logo |
| Flooring | yes -- area to boxes | finish, underlay | -- |
| Sofa | dimensions on request | configuration, fabric, legs | -- |
| Chair | -- | upholstery, frame finish | -- |
| Beds | dimensions on request | size, headboard, storage, finish | -- |
| Table | yes -- W x L x H | top material, base finish | engraving |
| Cupboard | yes -- fitted units | doors, internal layout, finish | -- |
| Cushions | size | fabric, filling, set size | print, text |
| Decor | -- | size, frame | calligraphy, names |

### The pricing decision, stated plainly

Automatic made-to-measure pricing is the highest-risk piece of code in this project. If a rug
formula is wrong by ten percent and a customer orders a 7'3" x 10'6" piece, the client absorbs
the difference on every order until someone notices.

Recommendation for launch: made-to-measure and heavily configured items produce a **quotation**,
not an instant checkout. The customer builds exactly what they want, sees an indicative price
range, and submits it; a salesperson confirms the real figure within a working day. Simple
stocked items -- a ready-made rug, a cushion cover, a decor piece -- check out instantly as
normal.

That gives a working store on day one without betting the margin on formulas nobody has
verified yet. Once the client's real pricing rules are written down and tested against past
invoices, the same configurator switches to instant pricing without touching the front end.

### Data model additions this requires

```
CustomizationTemplate   attached to a category or an individual product
  fields: CustomizationField[]

CustomizationField
  key, label, type: dimension | choice | text | upload | boolean
  constraints: min, max, unit, step, maxLength, allowedMimeTypes
  priceRule: none | perSqFt | perRunningFt | perBox | flatDelta | percentDelta
  required, displayOrder, dependsOn

CartItem / QuotationItem
  customization  JSON payload of the customer's answers
  priceSnapshot  what we quoted, frozen at time of adding
  pricingMode    instant | quotation
  proofStatus    none | pending | approved   (personalised items only)
```

The frozen `priceSnapshot` matters: prices and formulas change, and an order must always show
what the customer actually agreed to.

---

## 7. Animation policy

The existing animation work is good and we keep it. But your own requirements document warns against animating everything, and there is one concrete problem in the current code.

**`ParticleBackground.tsx` is a fixed, full-viewport Three.js canvas mounted globally on the homepage.** A permanently running WebGL context behind every section is a battery and framerate cost on exactly the mid-range Android devices most of your customers will use. Your requirements document explicitly says "avoid large unnecessary JavaScript libraries" and "remain smooth on mobile devices."

Recommended policy:

- **Framer Motion** for component-level UI: entrances, hovers, menus, modals, page transitions.
- **GSAP ScrollTrigger** for scroll-driven storytelling sections.
- **Lenis** for smooth scroll -- keep, it is a large part of why the site feels expensive.
- **Three.js lazy-loaded and route-scoped only**, for the product 3D viewer in Phase 7. Never in the global bundle.
- **`ParticleBackground`**: make it desktop-only and lazy, or retire it. Measure the difference on a real mid-range phone before deciding.
- **Respect `prefers-reduced-motion`** globally. This is a WCAG requirement your documents commit to, and it is about ten lines of work.
- **Never let animation delay product information.** Price, stock and specifications render immediately, always.

Product photography sells furnishings. Animation should frame the photography, never compete with it.

---

## 8. Phased plan

Website phases first. Everything after Phase 6 is post-launch and intentionally out of current focus.

### Phase 0 -- Rebrand & Foundation - 1 week

Get the identity and the plumbing right before building pages.

- Replace the midnight/gold palette with the logo-derived tokens as CSS custom properties in `globals.css`.
- Wire the real logo into Navbar, Footer and LoadingScreen (currently text-only "JALAL").
- Convert the site to the light theme; adjust glass and card treatments for light surfaces.
- Rename the legacy template components: `FeaturedDestinations` -> `ShowroomsSection`, `PropertiesShowcase` -> `ProductShowcase`, `ExperiencesSection` -> `CraftsmanshipSection`. Fix `images.sections.whyLexury` -> `whyJalals`.
- Add Prettier, tighten ESLint, add the GitHub Actions workflow (lint, typecheck, build).
- Add Docker Compose for local Postgres.
- Decide and document: is Jalal's Gilgit-Baltistan-focused or nationwide? The entire current site says GB. Every one of your documents says multiple cities.

**Done when:** the site renders in the client's brand colours with their logo, and a pull request cannot merge with type errors.

### Phase 1 -- Data Model & Catalog Spine - 1-2 weeks

The most important phase in the project. No user-visible output, and that is fine.

- Prisma schema for the full model in section 5.
- Category tree seeded with all 13 categories, Furniture parenting five of them, plus their attribute definitions and customization templates.
- `src/server/catalog/` service layer: queries for category tree, product listing with facets, product detail, search.
- Seed script producing realistic sample data -- 60-80 products with genuine variant matrices -- so every later phase is built against real-shaped data rather than three hardcoded items.
- The **CSV import template**, one sheet each for `categories`, `attributes`, `products`, `variants`, `store_availability`. This goes to the client immediately; their data entry is the long pole in the whole project and it can run in parallel with your development.

**Done when:** you can query "all rugs, 5x8, beige, under 20,000" from the service layer and get correct results, and the client has the import template in hand.

### Phase 2 -- Catalog Administration - 2 weeks

How 1,000 products actually get into the database.

- Admin authentication (Auth.js) with role checks enforced in the API layer, not by hiding buttons.
- Category and attribute-definition CRUD.
- Product and variant CRUD with media upload to Cloudinary.
- **CSV importer with dry-run validation**: reports duplicate SKUs, unknown categories, missing images and type errors *before* writing anything. Downloadable error report. Import history. Re-import by SKU updates rather than duplicates.
- Draft / active / archived publication states. Public queries never see drafts.

**Build this ugly and correct.** It is an internal tool. Do not spend a day on its visual design -- spend the day on validation, because bad data at 1,000 products is far more expensive than an unattractive admin table.

**Done when:** you can import a 1,000-row spreadsheet, get a clear error report on the bad rows, fix and re-import without creating duplicates.

### Phase 3 -- Storefront Browse & Search - 2-3 weeks

The part the client thinks is the whole project.

- `/shop` with faceted filtering, sorting and pagination, all state in the URL.
- `/categories/[slug]` landing pages with category-specific filters driven by `AttributeDefinition`.
- `/products/[slug]` detail: gallery, variant selector, full specifications, branch availability, related products, care instructions, spec-sheet download.
- Search with autocomplete over name, SKU, category, brand, colour and material.
- Product comparison (in your requirements document, absent from the earlier repo SRS).
- Wishlist and saved products.
- SEO throughout: metadata, canonicals, `Product` and `BreadcrumbList` structured data, XML sitemap, Open Graph.
- The `/rugs?size=5x8&colour=beige` facet URLs that replace vsurfaces' 110 hand-built collections.

**Done when:** every one of vsurfaces' 110 collections has an equivalent filter URL on your site that nobody had to create by hand.

### Phase 4 -- Content & Corporate Pages - 1-2 weeks

- `/about` with founder story, company history and milestones timeline (page exists, needs real content).
- `/stores` branch locator with map, hours, services, photos, directions; `/stores/[slug]` detail pages.
- `/contact`, `/consultation` with working form submission and lead capture.
- `/terms`, `/privacy`, `/returns`, `/delivery`, `/warranty`, `/faqs`, `/size-guide`, `/care-guides` -- all clearly marked as placeholders until the client supplies legal text.
- `/journal` and `/journal/[slug]`.
- Editable content pages in admin, because the client will keep changing this copy.

**Done when:** no dead links anywhere in navigation or footer, and every page the client will want to edit is editable without a deploy.

### Phase 5 -- Accounts, Cart, Checkout & Quotations - 3-4 weeks

- Customer registration, login, profile, saved addresses.
- Cart with variant-aware lines, quantity control, persistence across sessions.
- Checkout: address, delivery method, branch pickup, order review, terms acceptance. **Cash on Delivery at launch** -- online payment comes after.
- **The quotation workflow.** Products needing measurement, installation or customisation get "Request a Quote" instead of add-to-cart. The request carries products, variants, quantities, measurements, room photos, preferred branch and notes. This is in your requirements document and it is important -- a significant part of this catalog cannot be sold through a normal cart.
- Order state machine: Pending -> Confirmed -> Processing -> Packed -> Shipped -> Delivered, plus cancellation and return paths. Every transition records actor, timestamp and reason.
- Transactional email on order placement and status change, sent from a background job rather than inside the request.
- Order history in the customer account.

**Done when:** a test customer completes a COD order and sees it in their account; a quote request reaches the sales inbox with all its attachments.

### Phase 6 -- Hardening & Launch - 1-2 weeks

- End-to-end tests across browse, search, filter, cart, checkout, quotation and admin permissions.
- Real-device testing on mid-range Android, not just a desktop browser window.
- Lighthouse performance and accessibility passes; fix `prefers-reduced-motion` and keyboard navigation gaps.
- Rate limiting on public forms; database backups configured *and a restore actually tested*.
- Analytics event taxonomy: product views, searches, filter usage, add-to-cart, checkout start, quote requests.
- Soft launch, monitor, then announce.

**Website complete. Roughly 11-16 weeks of focused solo work.**

---

### Post-launch phases -- planned, not now

| Phase | Scope | Estimate | Hard prerequisite |
|---|---|---|---|
| 7 | Product 3D viewer (GLB/glTF) + room visualizer MVP for flat surfaces | 4-8 weeks | Real product dimensions and optimised 3D assets. This is a content production pipeline, not just code. |
| 8 | AI design assistant + RAG chatbot | 3-6 weeks | A complete catalog in the database. Cannot start meaningfully before Phase 3 is done. |
| 9 | CIS integration, live branch stock | 8-12 weeks | CIS API documentation, sandbox access and branch ID mapping from the client. **Blocked until they provide it.** |
| 10 | POS | Tied to 9 | CIS complete. |
| 11 | Finance dashboard, Super Admin, analytics | 6+ weeks | Real order volume to report on. |

---

## 9. Managing expectations honestly

Three things in the client brief need a frank conversation, and it is much cheaper to have it now than at delivery.

**"Upload a room photo and see a 3D animation of the product in it."** What is realistically achievable is a good 2D composite: detect the floor or wall plane, apply the product's texture in correct perspective, offer a before-and-after slider. That genuinely helps someone choose a rug or a laminate, and it is a real Phase 7 deliverable. What is *not* achievable on this budget is reconstructing a 3D model of a room from one photograph and animating furniture inside it -- that is research-grade computer vision. Your own requirements document makes the same point. Promise the composite, deliver it well, and treat walk-around 3D as a per-SKU content investment much later.

**3D models are a content cost, not a software feature.** Every product needing a rotatable 3D model needs someone to build and optimise that model from measurements and CAD or photography. At 1,000 products that is a budget line item and a staffing question, not a sprint. Start with the twenty best-selling products.

**CIS is the single biggest unknown in the project.** Until you have its API documentation and sandbox access, nobody can estimate the operations layer -- not you, not anyone. Request that documentation now, in writing, even though the work is months away. If it turns out CIS has no API, the entire approach changes, and you want to discover that early. In the meantime, branch availability is managed manually in admin, and **the site must never claim stock is "real time" until it actually is.**

---

## 10. Where to start

In order, this week:

1. **Confirm the category tree** in section 5 with the client. Everything downstream depends on it.
2. **Send the client the CSV import template** -- even before it is technically finished. Their data entry will take longer than your coding, and it can run in parallel from day one.
3. **Request in writing:** the branch list with addresses, phone numbers and hours; the founder biography and milestones; the legal text for terms, privacy, returns and warranty; and the CIS API documentation.
4. **Resolve the geography question:** Gilgit-Baltistan only, or nationwide? The current site assumes GB throughout.
5. **Then start Phase 0.** Rebrand to the client's actual colours before building anything new on top of the wrong palette.

The single highest-risk item is not any of the technology. It is **product data**. One thousand products across twelve categories, each with sizes, colours, materials and prices, plus three or four photographs each, is thousands of individual facts that only the client can supply. Start that clock today.

---

## Appendix -- Source documents

| File | Origin |
|---|---|
| `docs/source/requirements.docx.md` | `requirenments.docx` -- functional requirements, FR-CAT/VIS/AI/CHAT identifiers |
| `docs/source/development-roadmap.docx.md` | `JalalsGroup_Development_Roadmap.docx` -- phased engineering guide |
| `docs/source/jalal-enterprise-srs.docx.md` | `srs (2).docx` -- full enterprise vision including CIS, POS, finance |
| `docs/source/vsurfaces-collections.xml` | Reference site collection sitemap -- the 110-collection analysis |
| `docs/source/vsurfaces-pages.xml` | Reference site content page sitemap |
| `docs/SRS.md` | Earlier SRS draft. Superseded by this document where they conflict. |
