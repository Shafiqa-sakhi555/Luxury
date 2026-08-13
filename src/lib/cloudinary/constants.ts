export const CLOUDINARY_FOLDERS = {
  products: "jalals/products",
  categories: "jalals/categories",
} as const;

export type CloudinaryFolder = (typeof CLOUDINARY_FOLDERS)[keyof typeof CLOUDINARY_FOLDERS];
