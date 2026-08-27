export type AdminShopStyleRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  href: string;
  imageUrl: string | null;
  imagePublicId: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type AdminShopStyleFormValues = {
  title: string;
  subtitle: string;
  href: string;
  imageUrl?: string;
  imagePublicId?: string | null;
  sortOrder: number;
  isActive: boolean;
};
