# Jalal's Home Solution — Pakistan

Premium luxury home furnishings e-commerce by Jalal's Group Pakistan.

## Quick start

You need **two terminals** for local development:

**Terminal 1 — database**

```bash
npm install
npm run db:dev
```

Leave this running. Copy the `DATABASE_URL` it prints into your `.env` file (or use the default ports shown in `.env.example`).

**Terminal 2 — website**

```bash
cp .env.example .env   # first time only — then edit AUTH_SECRET
npm run db:setup       # first time only — creates tables + seed data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

If the site shows errors or blank catalog data, restart both terminals:

```bash
npm run db:dev          # Terminal 1
npm run dev:clean       # Terminal 2 — clears .next cache
```

## Admin dashboard

| | |
|---|---|
| **URL** | [http://localhost:3000/admin](http://localhost:3000/admin) |
| **Login page** | [http://localhost:3000/login](http://localhost:3000/login) |
| **Email** | `admin@jalalsgroup.com` |
| **Password** | `Admin123!` |

After signing in you get the operations dashboard with:

- **Overview** — revenue, orders, customers, products
- **Products** — catalog management
- **Categories** — category tree
- **Orders** — order processing
- **Inventory** — stock levels
- **Customers** — customer records
- **Settings** — system configuration

Only staff accounts (roles other than "Customer") can access `/admin`. Regular customers use `/account` after registering.

> Change the admin password before going to production.

## Useful commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Next.js dev server |
| `npm run dev:clean` | Clear `.next` cache and restart |
| `npm run db:dev` | Start local PostgreSQL (Prisma) |
| `npm run db:setup` | Run migrations + seed |
| `npm run db:seed` | Re-seed sample products & admin user |
| `npm run db:studio` | Visual database browser |
| `npm run build` | Production build |

## Project structure (Phase 1)

```
src/app/(storefront)/   Public website (home, shop, products, categories)
src/app/(admin)/        Admin dashboard (protected)
src/app/(auth)/         Login & register
src/app/(checkout)/     Cart & checkout
src/app/(account)/      Customer account area
prisma/                 Database schema, migrations, seed
```

## Color palette

| Token | Hex | Use |
|-------|-----|-----|
| Red | `#D71920` | Primary CTA, accents |
| Navy | `#1F2937` | Headings, nav |
| Ink | `#111827` | Body text |
| Luxury cream | `#F8F5F2` | Section backgrounds |
