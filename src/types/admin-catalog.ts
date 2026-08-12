export type CatalogSource = "prisma" | "supabase";

export type AdminProductListItem = {
  id: string;
  source: CatalogSource;
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
  source: CatalogSource;
};

export type AdminProductFormValues = {
  source: CatalogSource;
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
  imageUrls: string;
};

export type AdminProductDetail = AdminProductFormValues & {
  id: string;
  hasVariants: boolean;
  categoryName: string;
  categorySlug: string;
};
