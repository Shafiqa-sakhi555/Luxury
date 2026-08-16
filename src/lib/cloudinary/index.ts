import { v2 as cloudinary } from "cloudinary";
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
  mimeType?: string;
  publicId: string;
  overwrite?: boolean;
};

export async function uploadImageBuffer(
  buffer: Buffer,
  options: UploadOptions
): Promise<CloudinaryUploadResult> {
  ensureConfigured();

  const mimeType = options.mimeType || "image/jpeg";
  const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

  try {
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      public_id: options.publicId,
      resource_type: "image",
      unique_filename: false,
      overwrite: options.overwrite ?? true,
      invalidate: true,
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

export async function renameCloudinaryImage(
  fromPublicId: string,
  toPublicId: string
): Promise<CloudinaryUploadResult> {
  ensureConfigured();
  if (!fromPublicId || fromPublicId === toPublicId) {
    throw new Error("Invalid Cloudinary rename request.");
  }

  try {
    const result = await cloudinary.uploader.rename(fromPublicId, toPublicId, {
      overwrite: true,
      invalidate: true,
      resource_type: "image",
    });

    if (!result.secure_url || !result.public_id) {
      throw new Error("Cloudinary rename returned an incomplete response.");
    }

    return {
      secureUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width ?? 0,
      height: result.height ?? 0,
    };
  } catch (error) {
    throw new Error(formatCloudinaryError(error));
  }
}

export async function deleteCloudinaryImage(publicId: string) {
  ensureConfigured();
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
  } catch (error) {
    throw new Error(formatCloudinaryError(error));
  }
}

export async function replaceCloudinaryImage(
  oldPublicId: string | null | undefined,
  buffer: Buffer,
  options: UploadOptions
) {
  const uploaded = await uploadImageBuffer(buffer, options);
  if (oldPublicId && oldPublicId !== uploaded.publicId) {
    await deleteCloudinaryImage(oldPublicId).catch(() => undefined);
  }
  return uploaded;
}

export { getOptimizedImageUrl } from "@/lib/cloudinary/url";
export { formatCloudinaryError, getUploadErrorMessage } from "@/lib/cloudinary/errors";
export { finalizeProductCloudinaryImages } from "@/lib/cloudinary/finalize-product-images";
