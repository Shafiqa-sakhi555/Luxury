-- Homepage "Shop by style" cards (Your Imagination, Our Craftsmanship).
-- Fields match ShopStylesSection: title, subtitle, image, href.

CREATE TABLE IF NOT EXISTS public.shop_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  href TEXT NOT NULL,
  image_url TEXT,
  image_public_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_styles_active_sort
  ON public.shop_styles (is_active, sort_order, created_at);

ALTER TABLE public.shop_styles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_styles_select_public" ON public.shop_styles;
CREATE POLICY "shop_styles_select_public"
  ON public.shop_styles
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

INSERT INTO public.shop_styles (
  slug, title, subtitle, href, image_url, sort_order, is_active
) VALUES
  (
    'persian',
    'Persian Rugs',
    'Traditional & classical',
    '/shop?category=rugs',
    '/images/placeholders/1600566753190-17f0baa2a6c3.jpg',
    0,
    true
  ),
  (
    'turkish',
    'Turkish Rugs',
    'Vintage & modern weave',
    '/shop?category=rugs',
    '/images/placeholders/1600210492486-724fe5c67fb0.jpg',
    1,
    true
  ),
  (
    'prayer',
    'Prayer Mats',
    'Janamaz & saf carpets',
    '/shop?category=prayer-mats',
    '/images/placeholders/1600166898405-da9535204843.jpg',
    2,
    true
  ),
  (
    'furniture',
    'Premium Furniture',
    'Sofas, beds & dining',
    '/shop?category=furniture',
    '/images/placeholders/1555041469-a586c61ea9bc.jpg',
    3,
    true
  ),
  (
    'flooring',
    'Flooring',
    'Tiles, LVT & laminates',
    '/shop?category=flooring',
    '/images/placeholders/1600166898405-da9535204843.jpg',
    4,
    true
  ),
  (
    'decor',
    'Home Decor',
    'Curtains, cushions & accents',
    '/shop?category=decor',
    '/images/placeholders/1616046229476-9481a218f8b8.jpg',
    5,
    true
  )
ON CONFLICT (slug) DO NOTHING;
