import {
  buildProductImagePublicId,
  isDraftProductPublicId,
  isLegacyCloudinaryPublicId,
  isProductCloudinaryPublicId,
} from "@/lib/cloudinary/paths";
import { renameCloudinaryImage } from "@/lib/cloudinary";
import type { AdminProductImage } from "@/types/media";

function shouldRelocateProductImage(publicId: string, targetPublicId: string) {
  if (publicId === targetPublicId) return false;
  return (
    isDraftProductPublicId(publicId) ||
    isLegacyCloudinaryPublicId(publicId) ||
    (isProductCloudinaryPublicId(publicId) && !publicId.startsWith(targetPublicId.split("/").slice(0, -1).join("/")))
  );
}

export async function finalizeProductCloudinaryImages(
  productId: string,
  categorySlug: string,
  images: AdminProductImage[]
): Promise<AdminProductImage[]> {
  const finalized: AdminProductImage[] = [];

  for (let index = 0; index < images.length; index++) {
    const image = images[index];
    if (!image.url) continue;

    if (!image.publicId) {
      finalized.push(image);
      continue;
    }

    const targetPublicId = buildProductImagePublicId(categorySlug, productId, index);

    if (!shouldRelocateProductImage(image.publicId, targetPublicId)) {
      finalized.push(image);
      continue;
    }

    try {
      const renamed = await renameCloudinaryImage(image.publicId, targetPublicId);
      finalized.push({
        ...image,
        publicId: renamed.publicId,
        url: renamed.secureUrl,
        sortOrder: index,
      });
    } catch {
      finalized.push({ ...image, sortOrder: index });
    }
  }

  return finalized;
}
