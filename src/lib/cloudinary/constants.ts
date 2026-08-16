export { CLOUDINARY_ROOT } from "@/lib/cloudinary/paths";

export const CLOUDINARY_UPLOAD_TYPES = ["product", "category", "banner"] as const;

export type CloudinaryUploadType = (typeof CLOUDINARY_UPLOAD_TYPES)[number];
