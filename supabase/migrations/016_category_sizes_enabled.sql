-- Optional size options per category (rugs, blankets, etc.)
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS sizes_enabled BOOLEAN NOT NULL DEFAULT false;
