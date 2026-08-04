# Software Requirements Specification (SRS)
## Jalals Group / Luxury — Multi-Branch E-Commerce Platform

**Version:** 1.0  
**Date:** July 28, 2026  
**Status:** Draft — Phase 1 focus (Public Website)  
**Prepared for:** Jalals Group (Pakistan — luxury home surfaces & furnishings)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Honest Assessment & Recommendations](#2-honest-assessment--recommendations)
3. [Reference & Vision](#3-reference--vision)
4. [Current State (As-Is)](#4-current-state-as-is)
5. [Stakeholders & User Roles](#5-stakeholders--user-roles)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [System Architecture](#8-system-architecture)
9. [Data Model Overview](#9-data-model-overview)
10. [Phased Delivery Plan](#10-phased-delivery-plan)
11. [Phase 1 — Website (Current Priority)](#11-phase-1--website-current-priority)
12. [Phase 2 — Commerce & Admin](#12-phase-2--commerce--admin)
13. [Phase 3 — CIS, POS & Dashboards](#13-phase-3--cis-pos--dashboards)
14. [Phase 4 — AI, 3D Visualizer & Chatbot](#14-phase-4--ai-3d-visualizer--chatbot)
15. [Phase 5 — Finance, CRM & Advanced Ops](#15-phase-5--finance-crm--advanced-ops)
16. [Client Data Checklist](#16-client-data-checklist)
17. [Risks & Dependencies](#17-risks--dependencies)
18. [Out of Scope (For Now)](#18-out-of-scope-for-now)
19. [Acceptance Criteria Summary](#19-acceptance-criteria-summary)
20. [Appendix A — Product Category Structure](#appendix-a--product-category-structure)
21. [Appendix B — Page & Route Map](#appendix-b--page--route-map)

---

## 1. Executive Summary

Jalals Group requires a **custom, production-grade e-commerce platform** for a multi-branch luxury home surfaces and furnishings business in Pakistan. The platform must support:

- A **premium animated storefront** (reference: [vsurfaces.com](https://www.vsurfaces.com/))
- **10+ product categories** with variants (size, color, material, style)
- **Multi-branch stock visibility** (which product is available at which store)
- Future **CIS integration** for real-time inventory
- Future **AI room visualizer**, design assistant, and support chatbot
- Future **POS, finance dashboards**, and **Super Admin** oversight

**Current priority:** Build the **public website** first. CIS, dashboards, POS, and AI are **later phases**.

**Current codebase:** A polished **frontend-only** Next.js 15 marketing landing page (`Luxury/`) with static product data, animations, and a demo chatbot. **No backend, database, cart, checkout, or admin exists yet.**

---

## 2. Honest Assessment & Recommendations

### 2.1 What the client described vs. what exists

| Area | Client expectation | Reality today |
|------|-------------------|---------------|
| Full e-commerce | Shop, cart, checkout, orders | Homepage only; buttons are decorative |
| 10+ categories, variants | Full catalog with filters | 9 static products, 5 categories in `data.ts` |
| CIS integration | Real-time stock sync | No backend; CIS deferred |
| 3D room visualizer | Upload photo → see product in room | Not started; high complexity |
| AI design assistant | RAG + product suggestions | Demo keyword chatbot only |
| POS & finance dashboards | Branch-level ops | Not started |
| Admin / Super Admin | Full control panel | Not started |

### 2.2 Stack decision — use one architecture, not two

Your project notes mention **two conflicting stacks**:

| Document A (recommended) | Document B (do not use for this project) |
|--------------------------|------------------------------------------|
| Next.js + FastAPI + PostgreSQL + Redis | NestJS microservices + Prisma + API Gateway |
| Monolith-friendly, one repo | Enterprise microservices from day one |

**Recommendation:** Use **Document A** (Next.js frontend + FastAPI backend + PostgreSQL + Redis + Docker Compose).

**Why:**
- Matches a first production e-commerce project — simpler to build, deploy, and maintain
- Your current repo is already Next.js; adding FastAPI in `/backend` is natural
- Microservices (NestJS, API Gateway, separate AI/CIS/chatbot services) are **overkill until you have traffic, team size, and proven CIS/AI requirements**
- You can extract services later (e.g., CIS sync worker, AI API) without rewriting everything

**Do not restart in NestJS.** Extend the existing `Luxury` repo.

### 2.3 Feature honesty — effort vs. value

| Feature | Complexity | Realistic approach |
|---------|------------|-------------------|
| Premium storefront + animations | Medium | **Phase 1** — reuse current UI, add real pages |
| Category catalog + variants | Medium | **Phase 1–2** — DB + admin CRUD |
| Cart + COD checkout | Medium | **Phase 2** — no payment gateway at launch |
| Multi-branch stock display | Medium–High | **Phase 2** (manual) → **Phase 3** (CIS sync) |
| Admin product management | Medium | **Phase 2** |
| Order confirmation email | Low–Medium | **Phase 2** |
| CIS integration | High | **Phase 3** — needs CIS API/docs from client |
| POS | High | **Phase 3** — tied to CIS |
| Finance dashboard | High | **Phase 5** |
| 3D room visualizer | **Very high** | **Phase 4** — start with 2D overlay/AR-lite, not full 3D animation |
| AI design assistant (RAG) | High | **Phase 4** — needs catalog + FAQ data first |
| Production chatbot | Medium–High | **Phase 4** — upgrade demo chatbot with LLM + handoff |
| WebXR / full 3D assets | Very high | **Future** — optional after Phase 4 MVP |

**3D visualizer truth:** A vsurfaces-style “Try at Home” AR experience typically uses **WebAR (8th Wall, model-viewer)** or **2D perspective compositing**, not a custom-built 3D animation engine. Building true 3D room reconstruction from a single photo is **research-grade** (months + ML pipeline). Phase 4 should deliver an **MVP**: upload room photo → overlay product texture/color on detected floor/wall regions, or simple AR model placement on mobile.

### 2.4 Timeline realism (single full-stack developer)

| Phase | Scope | Rough estimate |
|-------|--------|----------------|
| Phase 1 | Public website (catalog UI, content pages, animations) | 4–6 weeks |
| Phase 2 | Backend, auth, cart, COD, admin, emails | 6–8 weeks |
| Phase 3 | CIS, POS hooks, branch stock dashboards | 8–12 weeks (depends on CIS) |
| Phase 4 | AI visualizer MVP + chatbot | 8–10 weeks |
| Phase 5 | Finance, CRM, advanced analytics | 6+ weeks |

These assume **client provides catalog data, branch list, and legal copy on schedule**.

---

## 3. Reference & Vision

### 3.1 Reference site: vsurfaces.com

Key patterns to replicate (adapted for Jalals):

- **Homepage:** Hero, weekly deals, category collections, featured product
- **Collections:** Category landing (Modern Rugs, Prayer Mats, Beds, Sofas, Wall-to-Wall, etc.)
- **Product cards:** Image, dimensions, price, sale badge, “Add to cart”
- **Product detail:** Variants (color/size), sold-out state, quantity, order note
- **Cart drawer:** Subtotal, free delivery threshold, checkout CTA
- **Store locations:** Multi-city branches with phone numbers
- **AR / Try at home:** Product-level CTA (Phase 4)
- **Trust signals:** Returns policy, delivery nationwide, branch count

### 3.2 Jalals differentiators (client requirements)

1. **Richer category tree** — 10+ categories, each with multiple styles/sizes/materials
2. **Customization** — room photo upload + visual preview (Phase 4)
3. **AI design suggestions** — match products to room/style (Phase 4)
4. **Support chatbot** — product + order aware (Phase 4)
5. **CIS-backed inventory** — real-time stock per branch (Phase 3)
6. **POS sync** — sale at branch updates online stock (Phase 3)
7. **Super Admin** — full platform control (Phase 2 foundation → Phase 3+ expansion)
8. **Company story** — founder history, milestones, T&C (Phase 1 content pages)
9. **Premium animations** — retain current Framer Motion / GSAP / Three.js quality

---

## 4. Current State (As-Is)

### 4.1 Repository: `E:/Luxury`

```
Luxury/
├── public/images/          # Reference product/showroom images
├── src/
│   ├── app/                # layout.tsx, page.tsx, globals.css (single route /)
│   ├── components/         # Navbar, Footer, 11 section components, shared UI
│   ├── lib/                # data.ts (static seed), images.ts, utils.ts
│   └── providers/          # Lenis smooth scroll
├── package.json            # Next.js 15, React 19, Tailwind 4, Framer/GSAP/Three
└── (no backend, no docker, no tests)
```

### 4.2 Working today

- Loading splash, hero, showroom carousel, product grid with category filter
- Wishlist toggle (in-memory only)
- Demo AI concierge (keyword → canned replies)
- GB delivery map, testimonials, journal preview, membership tiers (display only)
- Particle / scroll animations

### 4.3 Not working / missing

- Search, cart, checkout, auth, product detail routes, admin, API, database
- All “Add to Cart”, “Shop Now”, membership CTAs
- Real multi-branch data (currently Gilgit Baltistan demo content — **update to client’s actual cities**)

---

## 5. Stakeholders & User Roles

| Role | Description | Phase |
|------|-------------|-------|
| **Guest** | Browse catalog, use visualizer (future), chatbot | 1+ |
| **Customer** | Register, cart, checkout, orders, addresses, wishlist | 2+ |
| **Branch Staff** | View branch stock, POS (future) | 3+ |
| **Branch Manager** | Branch orders, stock alerts, local reports | 3+ |
| **Admin** | Products, categories, orders, content | 2+ |
| **Finance** | Revenue, refunds, reconciliation | 5 |
| **Super Admin** | All permissions, users, audit logs, system config | 2 (basic) → 3+ (full) |

### RBAC permission matrix (target)

| Permission | Customer | Admin | Super Admin |
|------------|----------|-------|-------------|
| Browse catalog | ✓ | ✓ | ✓ |
| Place order | ✓ | ✓ | ✓ |
| Manage products | — | ✓ | ✓ |
| Manage orders | — | ✓ | ✓ |
| Manage users/roles | — | — | ✓ |
| View finance | — | — | ✓ |
| CIS / POS config | — | — | ✓ |
| Audit logs | — | read | full |

---

## 6. Functional Requirements

Requirements are tagged: **P1** (Phase 1), **P2**, **P3**, **P4**, **P5**.

### 6.1 Storefront & catalog

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001 | Homepage with hero, featured deals, category highlights, trust bar | P1 |
| FR-002 | Category pages for 10+ categories with sub-filters (style, size, material, price) | P1 |
| FR-003 | Product listing: grid/list, sort (price, newest, popular), pagination | P1 |
| FR-004 | Product detail: image gallery, variants, dimensions, price, sale price, description | P1 |
| FR-005 | Search across products (title, SKU, category, tags) | P1 |
| FR-006 | “Sold out” / “Low stock” badges per variant | P2 (manual) → P3 (CIS) |
| FR-007 | Branch availability: “Available at Islamabad, Karachi…” | P2 (manual) → P3 (CIS) |
| FR-008 | Wishlist (persisted for logged-in users) | P2 |
| FR-009 | Product reviews & ratings | P2 (optional) or post-launch |
| FR-010 | Coupons / weekly deals | P2 |

### 6.2 Cart & checkout

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-020 | Cart drawer + full cart page | P2 |
| FR-021 | Variant-aware cart lines | P2 |
| FR-022 | Checkout: address, delivery method, order note | P2 |
| FR-023 | Payment: **Cash on Delivery (COD)** at launch | P2 |
| FR-024 | Order confirmation page + email | P2 |
| FR-025 | Online payment (JazzCash / EasyPaisa / card) | Post-P2 |
| FR-026 | Order tracking: Pending → Confirmed → Processing → Packed → Shipped → Delivered | P2 |

### 6.3 Customer account

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-030 | Register / login (email + password) | P2 |
| FR-031 | Profile, saved addresses | P2 |
| FR-032 | Order history & status | P2 |
| FR-033 | 2FA for staff/admin | P3+ |

### 6.4 Content & company

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-040 | About company, founder/boss history, milestones timeline | P1 |
| FR-041 | Store locator page (all branches, map, contact) | P1 |
| FR-042 | Terms & Conditions (`/terms`) — placeholder until client provides text | P1 |
| FR-043 | Privacy Policy (`/privacy`) — placeholder | P1 |
| FR-044 | Returns & delivery policy pages | P1 |
| FR-045 | Blog / journal (optional P1: list only; P2: CMS) | P1–P2 |
| FR-046 | Consultation / contact / book visit forms | P1 |

### 6.5 Admin

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-050 | Admin login (role-protected) | P2 |
| FR-051 | Product CRUD with variants, images, soft delete | P2 |
| FR-052 | Category CRUD + reorder | P2 |
| FR-053 | Order management + status updates | P2 |
| FR-054 | Branch management (name, address, phone) | P2 |
| FR-055 | Manual stock per branch per SKU | P2 |
| FR-056 | Content editor for About, milestones (simple) | P2 |
| FR-057 | Bulk catalog import script | P2 |
| FR-058 | Dashboard KPIs (orders, revenue) — basic | P2 |
| FR-059 | Super Admin: user/role management, audit log | P3 |

### 6.6 CIS, POS & inventory (deferred)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-070 | CIS sync service (inventory, orders — TBD per CIS API) | P3 |
| FR-071 | Real-time stock updates on product pages | P3 |
| FR-072 | POS: record sale → decrement branch stock → sync CIS | P3 |
| FR-073 | Stock transfer between branches | P3 |
| FR-074 | Discrepancy alerts (CIS vs web) | P3 |

### 6.7 AI & visualizer (deferred)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-080 | Upload room photo for visualization | P4 |
| FR-081 | Surface detection (floor/wall) — MVP scope | P4 |
| FR-082 | Apply selected product (texture/color) to surfaces | P4 |
| FR-083 | Product recommendations based on room/style | P4 |
| FR-084 | AI chatbot: catalog + FAQ + order status (RAG) | P4 |
| FR-085 | Human handoff to support ticket | P4 |
| FR-086 | WebXR / full 3D models | Future |

### 6.8 Finance & CRM (deferred)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-090 | Finance dashboard: revenue, refunds, branch breakdown | P5 |
| FR-091 | CRM: leads from forms, campaign tracking | P5 |
| FR-092 | Supplier / purchase orders | P5 |

---

## 7. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-001 | Page load (LCP) | < 3s on 4G |
| NFR-002 | Mobile responsive | All breakpoints |
| NFR-003 | SEO | Meta, OG, sitemap, structured data (Product) |
| NFR-004 | Accessibility | WCAG 2.1 AA where feasible |
| NFR-005 | Security | JWT, bcrypt, HTTPS, rate limit, input validation |
| NFR-006 | Availability | 99.5% uptime target (post-production) |
| NFR-007 | CIS offline | Graceful degradation — show “call store” if sync stale |
| NFR-008 | Images | Optimized (Next/Image, WebP), Cloudinary for uploads |
| NFR-009 | i18n | English first; Urdu optional later |
| NFR-010 | Currency | PKR only at launch |

---

## 8. System Architecture

### 8.1 Target architecture (recommended)

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              Next.js 15 (App Router) — frontend/             │
│  Pages │ Components │ Context │ API client (lib/api.ts)     │
└─────────────────────────┬───────────────────────────────────┘
                          │ REST / JSON
┌─────────────────────────▼───────────────────────────────────┐
│                 FastAPI — backend/app/                       │
│  routers/ │ services/ │ models.py │ schemas.py              │
└──────┬──────────────┬──────────────┬────────────────────────┘
       │              │              │
       ▼              ▼              ▼
  PostgreSQL       Redis         Cloudinary
  (primary DB)   (cache/sessions) (media)
```

**Phase 3+ add-ons (same repo, separate processes if needed):**

- `cis_sync/` — worker polling or webhook receiver for CIS
- `ai_service/` — optional FastAPI sub-app for RAG/visualizer (or external API)

### 8.2 Folder structure (target)

```
Luxury/
├── backend/
│   └── app/
│       ├── routers/       # auth, products, categories, cart, orders, admin, branches
│       ├── services/      # payments, email, storage, inventory
│       ├── models.py
│       ├── schemas.py
│       ├── database.py
│       ├── config.py
│       ├── main.py
│       ├── seed.py
│       └── import_catalog.py
├── frontend/              # move current src/ here OR keep root src/ — pick one
│   └── src/
│       ├── app/           # (shop), products, cart, checkout, account, admin, terms...
│       ├── components/
│       ├── context/
│       └── lib/
├── docker-compose.yml
└── docs/
    └── SRS.md             # this document
```

**Note:** Today the Next.js app lives at repo root. Either migrate to `frontend/` or keep root layout — **choose one before Phase 2 backend work** and stay consistent.

### 8.3 External integrations (by phase)

| Service | Purpose | Phase |
|---------|---------|-------|
| Cloudinary | Product & room upload images | P2 |
| Resend / SMTP | Transactional email | P2 |
| CIS API | Inventory & orders | P3 |
| OpenAI / local LLM | Chatbot & design assistant | P4 |
| Replicate / custom CV | Room surface segmentation | P4 |
| JazzCash / EasyPaisa | Online payments | Post-launch |

---

## 9. Data Model Overview

### 9.1 Core entities

```
Category (tree: parent_id, slug, sort_order, image)
    └── Product (title, slug, description, base_price, status)
            └── ProductVariant (sku, size, color, material, style, price, weight)
                    └── BranchStock (branch_id, variant_id, quantity, reserved)

Branch (name, city, address, phone, lat, lng, is_active)
User (email, password_hash, role: customer|admin|super_admin|...)
Address (user_id, line1, city, phone, is_default)
Cart / CartItem (session or user-bound)
Order / OrderItem (status enum, payment_method, totals, branch_id optional)
OrderStatusHistory (audit trail)
ContentPage (slug, title, body — about, terms, privacy)
Media (cloudinary_id, url, alt)
Review (product_id, user_id, rating, text) — optional P2
ConsultationLead (name, phone, branch, message)
AuditLog (actor_id, action, entity, timestamp) — P3
```

### 9.2 Product variant dimensions (client catalog)

Each product can have one or more variant axes:

- **Size** (e.g., 6.6 x 9.5 FT, 80 x 120 cm)
- **Color** (e.g., Brown, Blue)
- **Material** (e.g., Wool, Boucle, Quartz)
- **Style** (e.g., Modern, Traditional)
- **Finish** (for surfaces — Matte, Polished)

Store as structured fields + `attributes JSON` for flexibility.

### 9.3 Order status flow

```
pending_confirmation → confirmed → processing → packed → shipped → delivered
         ↓
    cancelled / return_requested → returned → refunded (partial paths)
```

COD orders start at `pending_confirmation`. Admin confirms → processing pipeline.

---

## 10. Phased Delivery Plan

```
Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4 ──► Phase 5
Website     Commerce    CIS/POS     AI/3D       Finance/CRM
(PUBLIC)    + ADMIN     + STOCK     + CHAT      + ANALYTICS
  ▲
YOU ARE HERE
```

| Phase | Goal | Client can… |
|-------|------|-------------|
| **1** | Launch-quality public site | Browse categories, read about company, find stores, submit inquiries |
| **2** | Take orders (COD) | Shop, checkout, admin manages catalog & orders |
| **3** | Real inventory | See live stock per branch; POS updates CIS |
| **4** | Differentiation | Room visualizer + AI help |
| **5** | Business intelligence | Finance & CRM dashboards |

---

## 11. Phase 1 — Website (Current Priority)

### 11.1 Objectives

Deliver a **complete public-facing website** that matches the quality of the current landing page but with **real routes, category structure, and client-ready content placeholders**. Commerce buttons may link to “Coming soon” or be wired in Phase 2 — **decision: prefer stub cart with Phase 2 sprint immediately after**.

### 11.2 Deliverables

#### Pages & routes

| Route | Description |
|-------|-------------|
| `/` | Homepage (enhance current) |
| `/shop` | All products with filters |
| `/categories/[slug]` | Category landing |
| `/products/[slug]` | Product detail (static or API-ready shape) |
| `/collections` | All collections grid |
| `/about` | Company + founder story + milestones |
| `/stores` | Branch locator (map + list) |
| `/contact` | Contact + consultation form |
| `/terms` | T&C placeholder |
| `/privacy` | Privacy placeholder |
| `/returns` | Returns policy |
| `/delivery` | Delivery info |
| `/journal` | Blog listing |
| `/journal/[slug]` | Blog post (optional if posts provided) |

#### Category structure

Implement **10+ categories** (see Appendix A). Use **reference images** from `public/images/` until client assets arrive.

#### UI/UX

- Retain Framer Motion, GSAP scroll, premium typography
- Category collection sections like vsurfaces (“Modern Rugs”, “Prayer Mats”, …)
- Weekly deals / sale badges (static promos in P1)
- Mobile-first navigation with cart icon (drawer empty state OK in P1)
- Store locator for **client’s actual cities** (replace GB demo if needed)

#### Data approach for Phase 1

**Option A (fastest):** Expanded static data in `src/lib/catalog.ts` with full category tree + 50–100 sample products using reference images.

**Option B (better handoff to Phase 2):** Stand up FastAPI + Postgres early with seed script; frontend fetches from API. Slightly longer but avoids rewriting.

**Recommendation:** **Option B** if Phase 2 starts within 2 weeks; otherwise **Option A** with strict TypeScript types matching future API schema.

#### Animations

- Page transitions between shop and product detail
- Staggered product grid reveal
- Hero parallax (existing)
- Optional: product card hover zoom (existing patterns)

### 11.3 Phase 1 out of scope

- Real checkout, payments, user accounts
- CIS, POS, admin dashboards
- Production AI / 3D visualizer
- Email sending (form submissions can log to console or Google Sheet webhook)

### 11.4 Phase 1 acceptance criteria

- [ ] All routes in Appendix B return 200 with responsive layout
- [ ] 10+ categories visible in nav and `/shop` filters
- [ ] Product detail shows variants (UI only if no backend)
- [ ] About page includes milestones timeline (placeholder content OK)
- [ ] Terms & Privacy show `[PLACEHOLDER — replace with client-provided legal text]`
- [ ] Store page lists all branches client provides
- [ ] Lighthouse performance ≥ 80 mobile
- [ ] No broken links in nav/footer
- [ ] Reference images used consistently; alt text present

---

## 12. Phase 2 — Commerce & Admin

### 12.1 Objectives

Full **COD e-commerce** + **admin catalog management** so client can load real product data without developer for every SKU.

### 12.2 Key tasks (ordered)

1. **Audit payment flow** — confirm no premature order confirmation (Task 1 from project notes)
2. **Implement COD end-to-end** (Task 2)
3. **Backend scaffold** — FastAPI, Postgres, Redis, Docker Compose
4. **Auth** — JWT, customer + admin roles
5. **Cart & checkout API**
6. **Admin product/category CRUD** (Task 3)
7. **Terms & Privacy** wired to CMS (Task 4)
8. **Order emails** — Resend or SMTP (Task 5)
9. **Tests** — cart, checkout, auth, admin RBAC (Task 6)
10. **Import script** `import_catalog.py` (Task 7)

### 12.3 Phase 2 acceptance criteria

- [ ] Customer completes COD order from product page to confirmation
- [ ] Admin creates product with 3 variants and images
- [ ] Non-admin receives 403 on admin routes
- [ ] Order email sent on checkout
- [ ] Status update email sent when admin changes order
- [ ] pytest passes for checkout and auth

---

## 13. Phase 3 — CIS, POS & Dashboards

### 13.1 Prerequisites from client

- CIS documentation: API endpoints, auth, field mapping, sync frequency
- Branch IDs mapping (CIS branch ↔ web branch)
- POS workflow description (same system or separate?)
- Super Admin list and finance user roles

### 13.2 Deliverables

- CIS sync worker (real-time preferred, batch fallback)
- Branch stock on product pages
- Admin: inventory dashboard, sync health, discrepancy alerts
- POS module (or API for existing POS to call)
- Super Admin dashboard: users, roles, audit logs
- Branch Manager dashboard: local stock & orders

### 13.3 Graceful degradation

If CIS is unreachable:
- Show last synced stock with timestamp
- Disable “Buy now” if stock unknown after threshold
- Alert Super Admin

---

## 14. Phase 4 — AI, 3D Visualizer & Chatbot

### 14.1 Room visualizer MVP (realistic scope)

1. User uploads room photo (JPEG/PNG, max 10MB)
2. Backend runs surface segmentation (pre-trained model or third-party API)
3. User selects product/variant (e.g., floor tile, wall panel)
4. System overlays product texture/color on selected surface
5. Before/after slider + download/share image
6. **Not in MVP:** full 3D animation, furniture physics, multi-room walkthrough

### 14.2 AI design assistant

- RAG index: product catalog, care guides, FAQs, policies
- User: “Suggest flooring for a small living room, modern style”
- Response: 3–5 products with links + reasoning
- Requires Phase 2 catalog in DB

### 14.3 Chatbot upgrade

Replace `AIConciergeSection` demo with:
- LLM + RAG (product, orders for logged-in users)
- Conversation memory (session)
- Escalation: create support ticket + email branch

---

## 15. Phase 5 — Finance, CRM & Advanced Ops

- Finance dashboard: GMV, COD vs online, refunds, branch revenue
- CRM: consultation leads, campaigns, coupons
- Supplier POs, returns warehouse flow
- Marketing notifications (SMS/email — Pakistan providers)
- Advanced analytics & export

---

## 16. Client Data Checklist

Before catalog import, collect from client:

### 16.1 Company & content

- [ ] Legal company name, logo (SVG/PNG), brand colors
- [ ] Founder/boss biography & photos
- [ ] Milestones (dates + descriptions)
- [ ] Terms & Conditions (final legal text)
- [ ] Privacy Policy
- [ ] Returns & delivery policy
- [ ] Branch list: city, address, phone, hours, GPS coordinates
- [ ] Social media URLs

### 16.2 Catalog (per category)

- [ ] Category name, slug, description, hero image
- [ ] Subcategories / styles
- [ ] For each product:
  - Title, SKU, description (EN)
  - Category, tags
  - Base price, sale price (if any)
  - Variants: size, color, material, style, finish
  - Dimensions/weight
  - Images (min 3 angles) — **reference OK for dev**
  - Care instructions
  - Related products

### 16.3 Operations (Phase 3+)

- [ ] CIS API access & sandbox
- [ ] Branch codes in CIS
- [ ] POS integration spec
- [ ] Finance reporting requirements
- [ ] Admin user emails & roles

### 16.4 Suggested import format

Provide Excel/CSV with sheets: `categories`, `products`, `variants`, `branch_stock`, `branches`.

---

## 17. Risks & Dependencies

| Risk | Impact | Mitigation |
|------|--------|------------|
| CIS API unknown/delayed | Blocks Phase 3 | Manual branch stock in Phase 2 |
| 3D scope creep | Budget/time overrun | Fixed MVP in Phase 4 SRS |
| Catalog data delay | Empty shop | Reference images + import script |
| No payment gateway at launch | Limited conversion | COD + clear “Pay online coming soon” |
| Microservices temptation | Rework | Stay monolith until proven scale |
| Legal text not ready | Cannot go live | Placeholder pages, block checkout until final |
| Image rights | Legal | Client confirms reference image use |

---

## 18. Out of Scope (For Now)

- NestJS microservices rewrite
- Shopify/WooCommerce/Magento
- Native mobile apps (responsive web first)
- Full WebXR
- Multi-currency / international shipping
- Automated tax invoicing (FBR) — consult accountant later
- Real-time chat with human agents (Phase 4 ticket only)

---

## 19. Acceptance Criteria Summary

### Minimum viable launch (Phase 1 + 2)

1. Public website live with all content pages and 10+ categories
2. Customers place COD orders with email confirmation
3. Admins manage products, orders, and branch stock manually
4. Super Admin can manage admin users
5. Terms, Privacy, Returns, Delivery pages published
6. Performance and security baseline met

### Full client vision

Requires Phases 3–5 + sustained catalog/ops investment.

---

## Appendix A — Product Category Structure

Adapt to client’s exact list. Example aligned with vsurfaces + surfaces business:

| # | Category | Example sub-filters |
|---|----------|---------------------|
| 1 | Modern Rugs | Size, material, pattern |
| 2 | Traditional / Oriental Rugs | Size, origin style |
| 3 | Prayer Mats | Size, foldable, backrest |
| 4 | Wall-to-Wall Carpets | Room size, material |
| 5 | Sofas & Couches | Configuration, fabric, color |
| 6 | Beds & Mattresses | Size (single/double/king), storage |
| 7 | Curtains & Drapes | Length, fabric, opacity |
| 8 | Cushions & Throws | Size, set quantity |
| 9 | Marble & Quartz Surfaces | Finish, thickness, application |
| 10 | Wall Panels | Material, 3D pattern, color |
| 11 | Flooring (LVT/Laminate) | Thickness, wear layer, plank size |
| 12 | Outdoor / Patio | Weather resistance |
| 13 | Custom Orders | Consultation-led (no fixed SKU) |

Each category: **collection landing page** + **filters** + **product count** (“View all 219 products”).

---

## Appendix B — Page & Route Map

```
/                          Homepage
/shop                      Shop all
/categories                Category index
/categories/[slug]         Category products
/products/[slug]           Product detail
/collections               Featured collections
/about                     Company story
/about/milestones          Timeline (can be section on /about)
/stores                    Store locator
/stores/[slug]             Branch detail (optional)
/contact                   Contact form
/consultation              Book consultation
/terms                     Terms & Conditions
/privacy                   Privacy Policy
/returns                   Returns policy
/delivery                  Delivery information
/journal                   Blog index
/journal/[slug]            Blog post
/cart                      Cart (Phase 2)
/checkout                  Checkout (Phase 2)
/account                   Account hub (Phase 2)
/account/orders            Order history (Phase 2)
/login                     Login (Phase 2)
/register                  Register (Phase 2)
/admin                     Admin dashboard (Phase 2)
/admin/products            Product management
/admin/orders              Order management
/visualizer                Room visualizer (Phase 4)
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-07-28 | Development team | Initial SRS — phased plan, honest scope |

---

*Next step: Review this SRS with the client, confirm categories/branches, then begin **Phase 1** implementation starting with route scaffold + expanded catalog data structure.*
