-- Jalal's Home Solution — Supabase catalog schema
-- Run in Supabase SQL Editor or via: supabase db push

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_slug_idx on public.categories (slug);
create index if not exists categories_is_active_idx on public.categories (is_active);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  original_price numeric(12, 2) not null,
  sale_price numeric(12, 2) not null,
  discount_percentage numeric(5, 2) not null default 0,
  currency text not null default 'PKR',
  selling_unit text,
  included_items text,
  size text,
  fabric text,
  design text,
  sku text unique,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_slug_idx on public.products (slug);
create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_is_active_idx on public.products (is_active);
create index if not exists products_sku_idx on public.products (sku);

-- ---------------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------------
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_id_idx on public.product_images (product_id);
create index if not exists product_images_sort_order_idx on public.product_images (product_id, sort_order);

-- ---------------------------------------------------------------------------
-- product_specifications (extensible key/value specs for admin)
-- ---------------------------------------------------------------------------
create table if not exists public.product_specifications (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  spec_key text not null,
  spec_value text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, spec_key)
);

create index if not exists product_specifications_product_id_idx
  on public.product_specifications (product_id);

-- ---------------------------------------------------------------------------
-- inventory
-- ---------------------------------------------------------------------------
create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references public.products (id) on delete cascade,
  stock_quantity integer not null default 0,
  stock_status text not null default 'in_stock',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inventory_product_id_idx on public.inventory (product_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists categories_updated_at on public.categories;
create trigger categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists inventory_updated_at on public.inventory;
create trigger inventory_updated_at
  before update on public.inventory
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_specifications enable row level security;
alter table public.inventory enable row level security;

-- Public read for active catalog data
create policy "Public read active categories"
  on public.categories for select
  using (is_active = true);

create policy "Public read active products"
  on public.products for select
  using (is_active = true);

create policy "Public read product images"
  on public.product_images for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active = true
    )
  );

create policy "Public read product specifications"
  on public.product_specifications for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active = true
    )
  );

create policy "Public read inventory"
  on public.inventory for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active = true
    )
  );

-- Service role bypasses RLS; authenticated admin policies can be added later
-- when Auth.js ↔ Supabase user mapping is wired for the admin dashboard.

-- ---------------------------------------------------------------------------
-- Storage bucket (public product images)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read product images bucket" on storage.objects;
create policy "Public read product images bucket"
  on storage.objects for select
  using (bucket_id = 'product-images');
