-- Jalal's Home Solution — category-specific sizes and product variant extensions
-- Run after 014_admin_inbox.sql

-- ---------------------------------------------------------------------------
-- category_sizes — admin-defined size options per category
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.category_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories (id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category_id, label)
);

CREATE INDEX IF NOT EXISTS category_sizes_category_id_idx
  ON public.category_sizes (category_id);

CREATE INDEX IF NOT EXISTS category_sizes_category_sort_idx
  ON public.category_sizes (category_id, sort_order);

DROP TRIGGER IF EXISTS category_sizes_updated_at ON public.category_sizes;
CREATE TRIGGER category_sizes_updated_at
  BEFORE UPDATE ON public.category_sizes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- product_variants — link to category sizes + optional custom dimensions
-- ---------------------------------------------------------------------------
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS category_size_id UUID REFERENCES public.category_sizes (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS custom_width NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS custom_length NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS custom_width_unit TEXT,
  ADD COLUMN IF NOT EXISTS custom_length_unit TEXT,
  ADD COLUMN IF NOT EXISTS weight TEXT,
  ADD COLUMN IF NOT EXISTS dimensions TEXT,
  ADD COLUMN IF NOT EXISTS attributes JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS product_variants_category_size_id_idx
  ON public.product_variants (category_size_id);

-- ---------------------------------------------------------------------------
-- RLS — public read for active category sizes
-- ---------------------------------------------------------------------------
ALTER TABLE public.category_sizes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active category sizes" ON public.category_sizes;
CREATE POLICY "Public read active category sizes"
  ON public.category_sizes FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.categories c
      WHERE c.id = category_id AND c.is_active = true
    )
  );
