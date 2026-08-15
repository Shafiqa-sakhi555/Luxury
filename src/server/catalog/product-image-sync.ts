import type { AdminProductImage } from "@/types/media";
import { finalizeProductCloudinaryImages, deleteCloudinaryImage } from "@/lib/cloudinary";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { discoverProductImagesFromCloudinary } from "@/server/catalog/discover-product-images";

export async function resolveProductImagesForSync(input: {
  categorySlug: string;
  productId: string;
  images: AdminProductImage[];
  draftKey?: string | null;
  alt: string;
}): Promise<AdminProductImage[]> {
  const clientImages = input.images.filter((image) => image.url?.trim());

  if (clientImages.length > 0) {
    return clientImages;
  }

  return discoverProductImagesFromCloudinary({
    categorySlug: input.categorySlug,
    productId: input.productId,
    draftKey: input.draftKey,
    alt: input.alt,
  });
}

export async function syncProductImagesToDatabase(
  productId: string,
  images: AdminProductImage[],
  alt: string
) {
  const supabase = createSupabaseAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from("product_images")
    .select("cloudinary_public_id")
    .eq("product_id", productId)
    .is("variant_id", null);

  if (existingError) {
    throw new Error(`Could not load existing product images: ${existingError.message}`);
  }

  const nextPublicIds = new Set(images.map((image) => image.publicId).filter(Boolean));
  const removedPublicIds = (existing ?? [])
    .map((row) => row.cloudinary_public_id)
    .filter((publicId): publicId is string => Boolean(publicId && !nextPublicIds.has(publicId)));

  for (const publicId of removedPublicIds) {
    await deleteCloudinaryImage(publicId).catch(() => undefined);
  }

  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId)
    .is("variant_id", null);

  if (deleteError) {
    throw new Error(`Could not clear product images: ${deleteError.message}`);
  }

  if (images.length === 0) return;

  const { error: insertError } = await supabase.from("product_images").insert(
    images.map((image, index) => ({
      product_id: productId,
      image_url: image.url,
      cloudinary_public_id: image.publicId || null,
      alt_text: image.alt ?? alt,
      sort_order: index,
      is_primary: index === 0,
    }))
  );

  if (insertError) {
    const hint = insertError.message.includes("cloudinary_public_id")
      ? " Run supabase/migrations/004_cloudinary_media.sql in Supabase, then try again."
      : "";
    throw new Error(`Could not save product images: ${insertError.message}.${hint}`);
  }
}

export async function persistProductImages(input: {
  productId: string;
  categorySlug: string;
  images: AdminProductImage[];
  draftKey?: string | null;
  alt: string;
}) {
  const resolvedImages = await resolveProductImagesForSync({
    categorySlug: input.categorySlug,
    productId: input.productId,
    images: input.images,
    draftKey: input.draftKey,
    alt: input.alt,
  });

  const finalizedImages = await finalizeProductCloudinaryImages(
    input.productId,
    input.categorySlug,
    resolvedImages
  );

  await syncProductImagesToDatabase(input.productId, finalizedImages, input.alt);

  return finalizedImages;
}
