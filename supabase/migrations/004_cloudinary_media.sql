-- Cloudinary metadata for admin-uploaded images

ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS cloudinary_public_id TEXT;

CREATE INDEX IF NOT EXISTS product_images_cloudinary_public_id_idx
  ON public.product_images (cloudinary_public_id)
  WHERE cloudinary_public_id IS NOT NULL;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS cloudinary_public_id TEXT;
