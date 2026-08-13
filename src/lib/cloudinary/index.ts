import { v2 as cloudinary } from "cloudinary";
import { type CloudinaryFolder } from "@/lib/cloudinary/constants";
import { formatCloudinaryError } from "@/lib/cloudinary/errors";
import {
  getCloudinaryApiKey,
  getCloudinaryApiSecret,
  getCloudinaryCloudName,
  isCloudinaryConfigured,
} from "@/lib/cloudinary/env";
import type { CloudinaryUploadResult } from "@/types/media";

let configured = false;

function ensureConfigured() {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured. Add CLOUDINARY_* variables to .env.");
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: getCloudinaryCloudName(),
      api_key: getCloudinaryApiKey(),
      api_secret: getCloudinaryApiSecret(),
      secure: true,
    });
    configured = true;
  }
}

type UploadOptions = {
  filename?: string;
  mimeType?: string;
};

export async function uploadImageBuffer(
  buffer: Buffer,
  folder: CloudinaryFolder,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  ensureConfigured();

  const mimeType = options.mimeType || "image/jpeg";
  const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

  try {
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: "image",
      use_filename: Boolean(options.filename),
      unique_filename: true,
      overwrite: false,
    });

    if (!uploadResult.secure_url || !uploadResult.public_id) {
      throw new Error("Cloudinary upload returned an incomplete response.");
    }

    return {
      secureUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      width: uploadResult.width ?? 0,
      height: uploadResult.height ?? 0,
    };
  } catch (error) {
    throw new Error(formatCloudinaryError(error));
  }
}

export async function deleteCloudinaryImage(publicId: string) {
  ensureConfigured();
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (error) {
    throw new Error(formatCloudinaryError(error));
  }
}

export async function replaceCloudinaryImage(
  oldPublicId: string | null | undefined,
  buffer: Buffer,
  folder: CloudinaryFolder,
  options: UploadOptions = {}
) {
  const uploaded = await uploadImageBuffer(buffer, folder, options);
  if (oldPublicId && oldPublicId !== uploaded.publicId) {
    await deleteCloudinaryImage(oldPublicId).catch(() => undefined);
  }
  return uploaded;
}

export { getOptimizedImageUrl } from "@/lib/cloudinary/url";
export { formatCloudinaryError, getUploadErrorMessage } from "@/lib/cloudinary/errors";
