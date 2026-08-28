export type AdminCategoryStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

export type AdminCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  heroImage: string | null;
  heroImagePublicId: string | null;
  parentId: string | null;
  sortOrder: number;
  status: AdminCategoryStatus;
  productCount: number;
  sizesEnabled?: boolean;
  children: AdminCategoryChildRow[];
};

export type AdminCategoryChildRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  heroImage: string | null;
  heroImagePublicId: string | null;
  parentId: string | null;
  sortOrder: number;
  status: AdminCategoryStatus;
  productCount: number;
  sizesEnabled?: boolean;
};

import type { AdminCategorySizeInput } from "@/types/category-sizes";

export type AdminCategoryFormValues = {
  name: string;
  slug?: string;
  description?: string;
  heroImage?: string;
  heroImagePublicId?: string | null;
  parentId?: string | null;
  sortOrder: number;
  status: AdminCategoryStatus;
  sizes?: AdminCategorySizeInput[];
  sizesEnabled?: boolean;
};

export type AdminCategoryRowWithSizes = AdminCategoryRow & {
  sizes: import("@/types/category-sizes").AdminCategorySize[];
};
