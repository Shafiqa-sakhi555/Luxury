export function getOptimizedImageUrl(
  url: string,
  options?: { width?: number; height?: number; crop?: "fill" | "scale" | "limit" }
) {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  const transforms = ["f_auto", "q_auto"];
  if (options?.width) transforms.push(`w_${options.width}`);
  if (options?.height) transforms.push(`h_${options.height}`);
  if (options?.crop) transforms.push(`c_${options.crop}`);

  return url.replace("/upload/", `/upload/${transforms.join(",")}/`);
}

export function isRenderableImageUrl(url: string | null | undefined): url is string {
  if (!url?.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function readCloudName() {
  const raw = process.env.CLOUDINARY_CLOUD_NAME?.trim().replace(/^['"]|['"]$/g, "");
  return raw || null;
}

export function cloudinaryUrlFromPublicId(publicId: string) {
  const cloudName = readCloudName();
  if (!cloudName || !publicId.trim()) return null;
  return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId.trim()}`;
}

export function resolveCloudinaryImageUrl(
  imageUrl: string | null | undefined,
  publicId: string | null | undefined
) {
  const url = imageUrl?.trim();
  if (url) return url;
  if (!publicId?.trim()) return null;
  return cloudinaryUrlFromPublicId(publicId);
}
