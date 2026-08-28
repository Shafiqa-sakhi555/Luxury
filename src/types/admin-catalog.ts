import type { AdminProductImage } from "@/types/media";
import type { AdminProductVariantDetail, AdminProductVariantInput } from "@/types/category-sizes";

export type CatalogSource = "supabase";

export type AdminProductListItem = {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  categorySlug: string;
  skuCount: number;
  priceFromMinor: number;
  status: string;
  isFeatured: boolean;
  imageUrl: string | null;
  updatedAt: string;
  hasVariants?: boolean;
};

export type AdminCategoryOption = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
};

export type AdminProductFormValues = {
  categoryId: string;
  colors: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  sku: string;
  originalPriceMajor: number;
  salePriceMajor: number;
  stockQuantity: number;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  isFeatured: boolean;
  sellingUnit: string;
  pricePerSquareFoot?: boolean;
  images: AdminProductImage[];
  draftKey?: string;
  /** When category has configured sizes, one entry per selected size */
  variants?: AdminProductVariantInput[];
  fabric?: string;
  design?: string;
};

export type AdminProductDetail = AdminProductFormValues & {
  id: string;
  hasVariants: boolean;
  categoryName: string;
  categorySlug: string;
  mainCategoryId: string;
  sectionId: string;
  variantDetails?: AdminProductVariantDetail[];
  usesCategorySizes?: boolean;
};

export type MutationResult = { ok: true; id: string } | { ok: false; error: string };
