import { v2 as cloudinary } from "cloudinary";
import {
  getCloudinaryApiKey,
  getCloudinaryApiSecret,
  getCloudinaryCloudName,
  isCloudinaryConfigured,
} from "@/lib/cloudinary/env";

type CloudinaryResource = {
  public_id: string;
  secure_url: string;
};

let configured = false;

function ensureConfigured() {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured.");
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

export type CloudinaryListedImage = {
  publicId: string;
  secureUrl: string;
};

export async function listCloudinaryImagesByPrefix(prefix: string): Promise<CloudinaryListedImage[]> {
  ensureConfigured();

  const normalizedPrefix = prefix.replace(/\/+$/, "");
  if (!normalizedPrefix) return [];

  const { resources } = await cloudinary.api.resources({
    type: "upload",
    prefix: normalizedPrefix,
    max_results: 30,
    resource_type: "image",
  });

  return ((resources ?? []) as CloudinaryResource[])
    .filter((resource) => resource.public_id && resource.secure_url)
    .map((resource) => ({
      publicId: resource.public_id,
      secureUrl: resource.secure_url,
    }))
    .sort((a, b) => a.publicId.localeCompare(b.publicId));
}
