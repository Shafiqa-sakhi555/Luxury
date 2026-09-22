-- Shipping types, product shipping fields, and database-backed rates.
-- Amounts are integer paisa (1 PKR = 100).

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS shipping_type TEXT NOT NULL DEFAULT 'COURIER',
  ADD COLUMN IF NOT EXISTS shipping_weight_kg NUMERIC(10, 3) NOT NULL DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS shipping_length_cm NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS shipping_width_cm NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS shipping_height_cm NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS furniture_kind TEXT;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_shipping_type_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_shipping_type_check
  CHECK (shipping_type IN ('COURIER', 'CARGO', 'FURNITURE'));

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_furniture_kind_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_furniture_kind_check
  CHECK (furniture_kind IS NULL OR furniture_kind IN ('sofa', 'dining_set', 'room_set', 'bed_set', 'default'));

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS default_shipping_type TEXT,
  ADD COLUMN IF NOT EXISTS furniture_kind TEXT;

ALTER TABLE public.categories
  DROP CONSTRAINT IF EXISTS categories_default_shipping_type_check;
ALTER TABLE public.categories
  ADD CONSTRAINT categories_default_shipping_type_check
  CHECK (
    default_shipping_type IS NULL
    OR default_shipping_type IN ('COURIER', 'CARGO', 'FURNITURE')
  );

ALTER TABLE public.categories
  DROP CONSTRAINT IF EXISTS categories_furniture_kind_check;
ALTER TABLE public.categories
  ADD CONSTRAINT categories_furniture_kind_check
  CHECK (furniture_kind IS NULL OR furniture_kind IN ('sofa', 'dining_set', 'room_set', 'bed_set', 'default'));

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_breakdown JSONB;

CREATE TABLE IF NOT EXISTS public.shipping_weight_bands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipping_type TEXT NOT NULL CHECK (shipping_type IN ('COURIER', 'CARGO')),
  max_weight_kg NUMERIC(10, 3),
  rate_minor INTEGER NOT NULL CHECK (rate_minor >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS shipping_weight_bands_type_sort_idx
  ON public.shipping_weight_bands (shipping_type, sort_order);

CREATE TABLE IF NOT EXISTS public.shipping_furniture_rates (
  kind TEXT PRIMARY KEY CHECK (kind IN ('sofa', 'dining_set', 'room_set', 'bed_set', 'default')),
  label TEXT NOT NULL,
  rate_minor INTEGER NOT NULL CHECK (rate_minor >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.shipping_weight_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_furniture_rates ENABLE ROW LEVEL SECURITY;

INSERT INTO public.shipping_weight_bands (shipping_type, max_weight_kg, rate_minor, sort_order)
VALUES
  ('COURIER', 1, 25000, 0),
  ('COURIER', 3, 40000, 1),
  ('COURIER', 5, 60000, 2),
  ('COURIER', 10, 90000, 3),
  ('COURIER', NULL, 120000, 4),
  ('CARGO', 10, 100000, 0),
  ('CARGO', 20, 150000, 1),
  ('CARGO', 30, 200000, 2),
  ('CARGO', 40, 250000, 3),
  ('CARGO', NULL, 350000, 4)
ON CONFLICT (shipping_type, sort_order) DO NOTHING;

INSERT INTO public.shipping_furniture_rates (kind, label, rate_minor)
VALUES
  ('sofa', 'Sofa delivery', 500000),
  ('dining_set', 'Dining set', 600000),
  ('room_set', 'Room set', 700000),
  ('bed_set', 'Bed set', 500000),
  ('default', 'Large furniture', 500000)
ON CONFLICT (kind) DO NOTHING;

UPDATE public.store_settings
SET free_delivery_threshold_minor = 20000000
WHERE id = 1 AND free_delivery_threshold_minor = 5000000;

UPDATE public.categories
SET default_shipping_type = 'COURIER'
WHERE default_shipping_type IS NULL
  AND (
    slug ~* 'towel|prayer|janamaz|pillow|cushion|curtain|blanket|quilt|bed-?sheet|linen'
    OR name ~* 'towel|prayer|janamaz|pillow|cushion|curtain|blanket|quilt|bed.?sheet|linen'
  );

UPDATE public.categories
SET default_shipping_type = 'CARGO'
WHERE default_shipping_type IS NULL
  AND (
    slug ~* 'runner|carpet|rug|mirror'
    OR name ~* 'runner|carpet|rug|mirror'
  );

UPDATE public.categories
SET
  default_shipping_type = 'FURNITURE',
  furniture_kind = CASE
    WHEN slug ~* 'sofa|seater|settee|dewan' OR name ~* 'sofa|seater|settee|dewan' THEN 'sofa'
    WHEN slug ~* 'dining' OR name ~* 'dining' THEN 'dining_set'
    WHEN slug ~* 'room[- ]?set' OR name ~* 'room[[:space:]]?set' THEN 'room_set'
    WHEN slug ~* 'bed[- ]?set|bedroom' OR name ~* 'bed[[:space:]]?set|bedroom' THEN 'bed_set'
    ELSE 'default'
  END
WHERE default_shipping_type IS NULL
  AND (
    slug ~* 'sofa|seater|settee|dewan|dining|room[- ]?set|bed[- ]?set|bedroom|rocking|coffee|furniture|chair|table'
    OR name ~* 'sofa|seater|settee|dewan|dining|room[[:space:]]?set|bed[[:space:]]?set|bedroom|rocking|coffee|furniture|chair|table'
  );

UPDATE public.products p
SET
  shipping_type = COALESCE(c.default_shipping_type, 'COURIER'),
  furniture_kind = c.furniture_kind,
  shipping_weight_kg = CASE COALESCE(c.default_shipping_type, 'COURIER')
    WHEN 'CARGO' THEN 15
    WHEN 'FURNITURE' THEN 50
    ELSE 0.5
  END
FROM public.categories c
WHERE p.category_id = c.id
  AND p.shipping_type = 'COURIER'
  AND p.shipping_weight_kg = 0.5
  AND c.default_shipping_type IS NOT NULL
  AND c.default_shipping_type <> 'COURIER';
