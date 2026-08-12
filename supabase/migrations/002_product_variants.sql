-- Jalal's Home Solution — product variants for carpet collections
-- Run after 001_catalog_schema.sql

alter table public.products
  add column if not exists has_variants boolean not null default false;

-- ---------------------------------------------------------------------------
-- product_variants
-- ---------------------------------------------------------------------------
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique,
  name text,
  design text,
  color text,
  quality text,
  size text,
  original_price numeric(12, 2) not null,
  sale_price numeric(12, 2) not null,
  discount_percentage numeric(5, 2) not null default 0,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_variants_product_id_idx on public.product_variants (product_id);
create index if not exists product_variants_sku_idx on public.product_variants (sku);

alter table public.product_images
  add column if not exists variant_id uuid references public.product_variants (id) on delete cascade;

create index if not exists product_images_variant_id_idx on public.product_images (variant_id);

-- ---------------------------------------------------------------------------
-- variant inventory
-- ---------------------------------------------------------------------------
create table if not exists public.product_variant_inventory (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null unique references public.product_variants (id) on delete cascade,
  stock_quantity integer,
  stock_status text not null default 'in_stock',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_variant_inventory_variant_id_idx
  on public.product_variant_inventory (variant_id);

drop trigger if exists product_variants_updated_at on public.product_variants;
create trigger product_variants_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

drop trigger if exists product_variant_inventory_updated_at on public.product_variant_inventory;
create trigger product_variant_inventory_updated_at
  before update on public.product_variant_inventory
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.product_variants enable row level security;
alter table public.product_variant_inventory enable row level security;

drop policy if exists "Public read active product variants" on public.product_variants;
create policy "Public read active product variants"
  on public.product_variants for select
  using (
    is_active = true
    and exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active = true
    )
  );

drop policy if exists "Public read variant inventory" on public.product_variant_inventory;
create policy "Public read variant inventory"
  on public.product_variant_inventory for select
  using (
    exists (
      select 1
      from public.product_variants v
      join public.products p on p.id = v.product_id
      where v.id = variant_id and v.is_active = true and p.is_active = true
    )
  );

drop policy if exists "Public read product images" on public.product_images;
create policy "Public read product images"
  on public.product_images for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active = true
    )
    or exists (
      select 1
      from public.product_variants v
      join public.products p on p.id = v.product_id
      where v.id = variant_id and v.is_active = true and p.is_active = true
    )
  );
