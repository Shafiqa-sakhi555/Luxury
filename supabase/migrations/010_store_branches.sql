-- Extend existing stores table for homepage showroom cards + branch detail pages.
-- Amounts/fields match FeaturedDestinations: name, region label, image, product count.
-- Detail page uses description, address (location), and image.

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS hours TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_public_id TEXT,
  ADD COLUMN IF NOT EXISTS product_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE public.stores
SET region = COALESCE(NULLIF(region, ''), city)
WHERE region IS NULL OR region = '';

ALTER TABLE public.stores
  ALTER COLUMN region SET DEFAULT '',
  ALTER COLUMN region SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stores_active_sort ON public.stores (is_active, sort_order, name);

-- Seed the five homepage showrooms (safe to re-run)
INSERT INTO public.stores (
  slug,
  name,
  city,
  region,
  address,
  phone,
  description,
  hours,
  image_url,
  product_count,
  sort_order,
  is_active
)
VALUES
  (
    'gilgit',
    'Gilgit',
    'Gilgit',
    'Gilgit City',
    'Shahr-e-Quaid-e-Azam, near Bank Alfalah, near Pizza King, Tehsil Gilgit, 15100, Gilgit-Baltistan, Pakistan',
    '0355 4948703',
    'Our flagship Jalal''s Home Solution showroom in Gilgit city. Visit for carpets, rugs, furniture, flooring, curtains, and home décor with specialist advice on sizing and installation.',
    'Open daily — call for exact hours',
    '/images/placeholders/1449824913935-59a10b8d2000.jpg',
    320,
    1,
    true
  ),
  (
    'hunza',
    'Hunza',
    'Hunza',
    'Hunza Valley',
    'Hospital Road, Aliabad, Hunza, Gilgit-Baltistan, Pakistan',
    '0355 4323944',
    'Full home furnishing range for Hunza valley. Come in to see curtains, carpets, prayer mats, and décor suited to homes across Aliabad and the surrounding valleys.',
    'Open daily — call for exact hours',
    '/images/placeholders/1464822759023-fed622ff2c3b.jpg',
    185,
    2,
    true
  ),
  (
    'skardu',
    'Skardu',
    'Skardu',
    'Skardu District',
    'Pak Turk Carpet 2, 7JWR+XXH, Skardu, Gilgit-Baltistan, Pakistan',
    '0355 4948709',
    'Pak Turk Carpets Skardu branch — premium carpets, rugs, and home interiors for Skardu District. Our team can help with room measurements and custom orders.',
    'Open daily — call for exact hours',
    '/images/placeholders/1506905925346-21bda4d32df4.jpg',
    210,
    3,
    true
  ),
  (
    'gakuch',
    'Gakuch',
    'Gakuch',
    'Ghizer District',
    'Near Higher Secondary School, Gakuch, Ghizer, Gilgit-Baltistan, Pakistan',
    '0355 5404571',
    'Serving Ghizer District from Gakuch. Browse carpets, rugs, and home furnishings, and speak with staff about delivery and installation in the region.',
    'Open daily — call for exact hours',
    '/images/placeholders/1519681393784-d120267933ba.jpg',
    95,
    4,
    true
  ),
  (
    'kashrot',
    'Kashrot',
    'Gilgit',
    'Gilgit City',
    'Kashrot, Gilgit, Gilgit-Baltistan, Pakistan',
    '0313 5205272',
    'The original Jalal Carpets store in Kashrot — where Jalal Uddin founded the business. Visit for carpets, rugs, and classic home furnishing collections.',
    'Open daily — call for exact hours',
    '/images/placeholders/1449824913935-59a10b8d2000.jpg',
    120,
    5,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  city = EXCLUDED.city,
  region = EXCLUDED.region,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  description = COALESCE(public.stores.description, EXCLUDED.description),
  hours = COALESCE(public.stores.hours, EXCLUDED.hours),
  image_url = COALESCE(NULLIF(public.stores.image_url, ''), EXCLUDED.image_url),
  product_count = CASE
    WHEN public.stores.product_count = 0 THEN EXCLUDED.product_count
    ELSE public.stores.product_count
  END,
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  updated_at = NOW();
