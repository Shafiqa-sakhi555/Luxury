import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeCategorySlug } from "@/lib/supabase/catalog-categories";
import {
  buildBannerPublicId,
  buildCategoryHeroPublicId,
  buildProductDraftPublicId,
  buildProductImagePublicId,
  productImageAssetName,
  sanitizeCloudinarySegment,
} from "@/lib/cloudinary/paths";
import type { CloudinaryUploadType } from "@/lib/cloudinary/constants";

export type ResolvedUploadTarget = {
  folder: string;
  publicId: string;
  overwrite: boolean;
};

function unwrapCategorySlug(categories: unknown): string | null {
  if (!categories) return null;
  if (Array.isArray(categories)) {
    return categories[0]?.slug ?? null;
  }
  if (typeof categories === "object" && categories !== null && "slug" in categories) {
    return String((categories as { slug?: string }).slug ?? "") || null;
  }
  return null;
}

async function resolveCategorySlug(input: {
  categorySlug?: string | null;
  categoryId?: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  const categoryId = input.categoryId?.trim();

  if (categoryId) {
    const { data } = await supabase
      .from("categories")
      .select("slug")
      .eq("id", categoryId)
      .maybeSingle();

    if (data?.slug) {
      return sanitizeCloudinarySegment(normalizeCategorySlug(data.slug) ?? data.slug);
    }
  }

  const rawSlug = input.categorySlug?.trim();
  if (rawSlug) {
    const normalized = sanitizeCloudinarySegment(normalizeCategorySlug(rawSlug) ?? rawSlug);

    const { data } = await supabase
      .from("categories")
      .select("slug")
      .ilike("slug", normalized)
      .maybeSingle();

    if (data?.slug) {
      return sanitizeCloudinarySegment(normalizeCategorySlug(data.slug) ?? data.slug);
    }

    return normalized;
  }

  return null;
}

async function resolveCategorySlugFromProduct(productId: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("products")
    .select("category_id, categories ( slug )")
    .eq("id", productId)
    .maybeSingle();

  const joinedSlug = unwrapCategorySlug(data?.categories);
  if (joinedSlug) {
    return sanitizeCloudinarySegment(normalizeCategorySlug(joinedSlug) ?? joinedSlug);
  }

  if (data?.category_id) {
    return resolveCategorySlug({ categoryId: data.category_id });
  }

  return null;
}

async function resolveProductCategorySlug(input: {
  categorySlug?: string | null;
  categoryId?: string | null;
  productId?: string | null;
}) {
  const productId = input.productId?.trim();
  if (productId) {
    const fromProduct = await resolveCategorySlugFromProduct(productId);
    if (fromProduct) return fromProduct;
  }

  return resolveCategorySlug(input);
}

export async function resolveCloudinaryUploadTarget(input: {
  uploadType: CloudinaryUploadType;
  categorySlug?: string | null;
  categoryId?: string | null;
  productId?: string | null;
  draftKey?: string | null;
  imageIndex?: number;
  bannerKey?: string | null;
}): Promise<ResolvedUploadTarget> {
  const imageIndex = Math.max(0, input.imageIndex ?? 0);

  if (input.uploadType === "banner") {
    const bannerKey = sanitizeCloudinarySegment(input.bannerKey ?? "default");
    const publicId = buildBannerPublicId(bannerKey);
    const folder = publicId.slice(0, publicId.lastIndexOf("/"));
    return { folder, publicId, overwrite: true };
  }

  if (input.uploadType === "category") {
    let categorySlug = await resolveCategorySlug(input);
    if (!categorySlug && input.categorySlug?.trim()) {
      categorySlug = sanitizeCloudinarySegment(
        normalizeCategorySlug(input.categorySlug) ?? input.categorySlug
      );
    }
    if (!categorySlug) {
      throw new Error("Category slug is required before uploading a hero image.");
    }

    const publicId = buildCategoryHeroPublicId(categorySlug);
    const folder = publicId.slice(0, publicId.lastIndexOf("/"));
    return { folder, publicId, overwrite: true };
  }

  if (input.uploadType === "product") {
    const categorySlug = await resolveProductCategorySlug(input);
    if (!categorySlug) {
      throw new Error("Category not found. Select a valid category before uploading.");
    }

    const productId = input.productId?.trim();
    if (productId) {
      const publicId = buildProductImagePublicId(categorySlug, productId, imageIndex);
      const folder = publicId.slice(0, publicId.lastIndexOf("/"));
      return { folder, publicId, overwrite: true };
    }

    const draftKey = sanitizeCloudinarySegment(input.draftKey ?? "");
    if (!draftKey) {
      throw new Error("Select a category before uploading product images.");
    }

    const publicId = buildProductDraftPublicId(categorySlug, draftKey, imageIndex);
    const folder = publicId.slice(0, publicId.lastIndexOf("/"));
    return { folder, publicId, overwrite: true };
  }

  throw new Error("Unsupported upload type.");
}

export async function getCategorySlugById(categoryId: string) {
  return resolveCategorySlug({ categoryId });
}

export { productImageAssetName };
