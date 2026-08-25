-- Customer reviews shown on the homepage carousel.
-- Fields match TestimonialsSection: quote, name, location, image, rating.

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_name TEXT NOT NULL,
  reviewer_location TEXT NOT NULL DEFAULT '',
  quote TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  image_url TEXT,
  image_public_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_active_sort ON public.reviews (is_active, sort_order, created_at);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select_public" ON public.reviews;
CREATE POLICY "reviews_select_public"
  ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

INSERT INTO public.reviews (
  reviewer_name,
  reviewer_location,
  quote,
  rating,
  image_url,
  sort_order,
  is_active
)
SELECT
  seed.reviewer_name,
  seed.reviewer_location,
  seed.quote,
  seed.rating,
  seed.image_url,
  seed.sort_order,
  seed.is_active
FROM (
  VALUES
    (
      'Fatima Khan',
      'Gilgit City',
      'The Hunza Heritage Carpet transformed our living room. The quality is outstanding — you can feel the craftsmanship in every knot. Best furniture shop in Gilgit Baltistan!',
      5,
      '/images/placeholders/1494790108377-be9c29b29330.jpg',
      1,
      true
    ),
    (
      'Ahmed Hassan',
      'Skardu',
      'Ordered a complete sofa set for our guest house. Delivery was fast, prices are fair, and the team helped us choose the perfect colors for our mountain lodge.',
      5,
      '/images/placeholders/1507003211169-0a1dd7228f2d.jpg',
      2,
      true
    ),
    (
      'Sana Ali',
      'Hunza Valley',
      'Jalals Home Solution''s custom services are incredible. They made exactly what we wanted — traditional patterns with modern colors. Highly recommended!',
      5,
      '/images/placeholders/1438761681033-6461ffad8d80.jpg',
      3,
      true
    )
) AS seed(
  reviewer_name,
  reviewer_location,
  quote,
  rating,
  image_url,
  sort_order,
  is_active
)
WHERE NOT EXISTS (SELECT 1 FROM public.reviews LIMIT 1);
