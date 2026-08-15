export const CLOUDINARY_ROOT = "jalals-home-solution";

export function sanitizeCloudinarySegment(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function productImageAssetName(imageIndex: number) {
  return imageIndex === 0 ? "main" : `image-${imageIndex + 1}`;
}

export function buildProductImageFolder(categorySlug: string, productId: string | number) {
  return `${CLOUDINARY_ROOT}/products/${sanitizeCloudinarySegment(categorySlug)}/product-${productId}`;
}

export function buildProductDraftFolder(categorySlug: string, draftKey: string) {
  return `${CLOUDINARY_ROOT}/products/${sanitizeCloudinarySegment(categorySlug)}/draft-${sanitizeCloudinarySegment(draftKey)}`;
}

export function buildProductImagePublicId(
  categorySlug: string,
  productId: string | number,
  imageIndex: number
) {
  return `${buildProductImageFolder(categorySlug, productId)}/${productImageAssetName(imageIndex)}`;
}

export function buildProductDraftPublicId(
  categorySlug: string,
  draftKey: string,
  imageIndex: number
) {
  return `${buildProductDraftFolder(categorySlug, draftKey)}/${productImageAssetName(imageIndex)}`;
}

export function buildCategoryFolder(categorySlug: string) {
  return `${CLOUDINARY_ROOT}/categories/${sanitizeCloudinarySegment(categorySlug)}`;
}

export function buildCategoryHeroPublicId(categorySlug: string) {
  return `${buildCategoryFolder(categorySlug)}/hero`;
}

export function buildBannerFolder(bannerKey?: string) {
  const base = `${CLOUDINARY_ROOT}/banners`;
  return bannerKey ? `${base}/${sanitizeCloudinarySegment(bannerKey)}` : base;
}

export function buildBannerPublicId(bannerKey: string) {
  return `${buildBannerFolder(bannerKey)}/banner`;
}

export function isCategoryCloudinaryPublicId(publicId: string) {
  return publicId.startsWith(`${CLOUDINARY_ROOT}/categories/`);
}

export function isProductCloudinaryPublicId(publicId: string) {
  return publicId.startsWith(`${CLOUDINARY_ROOT}/products/`);
}

export function isBannerCloudinaryPublicId(publicId: string) {
  return publicId.startsWith(`${CLOUDINARY_ROOT}/banners/`);
}

export function isDraftProductPublicId(publicId: string) {
  return isProductCloudinaryPublicId(publicId) && publicId.includes("/draft-");
}

export function isLegacyCloudinaryPublicId(publicId: string) {
  return publicId.startsWith("jalals/");
}
