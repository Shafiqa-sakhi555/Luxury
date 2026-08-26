export type AdminStoreRow = {
  id: string;
  slug: string;
  name: string;
  city: string;
  region: string;
  address: string;
  phone: string;
  description: string | null;
  hours: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  productCount: number;
  sortOrder: number;
  isActive: boolean;
};

export type StorefrontBranch = {
  id: string;
  slug: string;
  name: string;
  city: string;
  region: string;
  address: string;
  phone: string;
  description: string | null;
  hours: string | null;
  imageUrl: string;
  productCount: number;
};

export type AdminStoreFormValues = {
  name: string;
  slug?: string;
  city: string;
  region: string;
  address: string;
  phone: string;
  description?: string;
  hours?: string;
  imageUrl?: string;
  imagePublicId?: string | null;
  productCount: number;
  sortOrder: number;
  isActive: boolean;
};
