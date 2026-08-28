export type AdminCategorySize = {
  id: string;
  categoryId: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
  isCustom: boolean;
};

export type AdminCategorySizeInput = {
  id?: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
  isCustom: boolean;
};

export type DimensionUnit = "ft" | "in" | "cm" | "m";

export type AdminProductVariantInput = {
  id?: string;
  categorySizeId: string;
  sizeLabel: string;
  isCustom: boolean;
  sku: string;
  originalPriceMajor: number;
  salePriceMajor: number;
  stockQuantity: number;
  weight?: string;
  dimensions?: string;
  color?: string;
  customWidth?: number;
  customLength?: number;
  customWidthUnit?: DimensionUnit;
  customLengthUnit?: DimensionUnit;
  attributes?: Record<string, string>;
  isDefault?: boolean;
};

export type AdminProductVariantDetail = AdminProductVariantInput & {
  id: string;
};
