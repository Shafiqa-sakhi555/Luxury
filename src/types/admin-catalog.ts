import type { AdminProductImage } from "@/types/media";

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
};

export type AdminProductFormValues = {
  categoryId: string;
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
  images: AdminProductImage[];
  draftKey?: string;
};

export type AdminProductDetail = AdminProductFormValues & {
  id: string;
  hasVariants: boolean;
  categoryName: string;
  categorySlug: string;
};

export type MutationResult = { ok: true; id: string } | { ok: false; error: string };
