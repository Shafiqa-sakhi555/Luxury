export type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
};

export type AdminProductImage = {
  url: string;
  publicId: string;
  alt?: string;
  sortOrder: number;
};

export type AdminHeroImage = {
  url: string;
  publicId: string;
} | null;
