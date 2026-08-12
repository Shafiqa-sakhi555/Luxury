export type CatalogProductImage = {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

export type CatalogProductSpec = {
  key: string;
  value: string;
  sortOrder: number;
};

export type CatalogProductVariant = {
  id: string;
  sku: string;
  name: string | null;
  design: string | null;
  color: string | null;
  quality: string | null;
  size: string | null;
  originalPriceMinor: number;
  salePriceMinor: number;
  discountPercentage: number;
  stockQuantity: number | null;
  stockStatus: string | null;
  isDefault: boolean;
  variantId: string | null;
  images: CatalogProductImage[];
};

export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
};

export type CatalogProduct = {
  id: string;
  source: "supabase" | "prisma";
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  originalPriceMinor: number;
  salePriceMinor: number;
  discountPercentage: number;
  currency: string;
  sellingUnit: string | null;
  includedItems: string | null;
  size: string | null;
  fabric: string | null;
  design: string | null;
  sku: string | null;
  isFeatured: boolean;
  category: CatalogCategory;
  images: CatalogProductImage[];
  specifications: CatalogProductSpec[];
  stockQuantity: number | null;
  stockStatus: string | null;
  hasVariants?: boolean;
  variants?: CatalogProductVariant[];
  /** Prisma variant ID — required for add-to-cart on Supabase-sourced products */
  variantId: string | null;
  brand: { name: string; slug: string } | null;
};

export type CatalogProductListResult = {
  items: CatalogProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
