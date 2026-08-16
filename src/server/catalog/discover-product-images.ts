import "server-only";

import {
  buildProductDraftFolder,
  buildProductImageFolder,
  CLOUDINARY_ROOT,
  sanitizeCloudinarySegment,
} from "@/lib/cloudinary/paths";
import { listCloudinaryImagesByPrefix } from "@/lib/cloudinary/list-images";
import type { AdminProductImage } from "@/types/media";

function imageSortKey(publicId: string) {
  const asset = publicId.split("/").pop() ?? publicId;
  if (asset === "main") return 0;
  const match = asset.match(/^image-(\d+)$/);
  return match ? Number(match[1]) : 999;
}

function mapListedImages(
  images: Awaited<ReturnType<typeof listCloudinaryImagesByPrefix>>,
  alt: string
): AdminProductImage[] {
  return images
    .sort((a, b) => imageSortKey(a.publicId) - imageSortKey(b.publicId))
    .map((image, index) => ({
      url: image.secureUrl,
      publicId: image.publicId,
      alt,
      sortOrder: index,
    }));
}

export async function discoverProductImagesFromCloudinary(input: {
  categorySlug: string;
  productId: string;
  draftKey?: string | null;
  alt?: string;
}): Promise<AdminProductImage[]> {
  const alt = input.alt ?? "Product image";
  const productPrefix = buildProductImageFolder(input.categorySlug, input.productId);
  const productImages = await listCloudinaryImagesByPrefix(productPrefix).catch(() => []);

  if (productImages.length > 0) {
    return mapListedImages(productImages, alt);
  }

  const draftKey = input.draftKey?.trim();
  if (draftKey) {
    const draftPrefix = buildProductDraftFolder(input.categorySlug, draftKey);
    const draftImages = await listCloudinaryImagesByPrefix(draftPrefix).catch(() => []);
    if (draftImages.length > 0) {
      return mapListedImages(draftImages, alt);
    }
  }

  const categoryPrefix = `${CLOUDINARY_ROOT}/products/${sanitizeCloudinarySegment(input.categorySlug)}/`;
  const categoryImages = await listCloudinaryImagesByPrefix(categoryPrefix).catch(() => []);
  const productToken = `product-${input.productId}`;
  const matched = categoryImages.filter(
    (image) =>
      image.publicId.includes(`/${productToken}/`) ||
      (draftKey ? image.publicId.includes(`/draft-${sanitizeCloudinarySegment(draftKey)}/`) : false)
  );

  return mapListedImages(matched, alt);
}
