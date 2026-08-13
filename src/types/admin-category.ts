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
};

export type AdminCategoryFormValues = {
  name: string;
  slug?: string;
  description?: string;
  heroImage?: string;
  heroImagePublicId?: string | null;
  parentId?: string | null;
  sortOrder: number;
  status: AdminCategoryStatus;
};
