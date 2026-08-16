function readEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;

  const value = raw.trim().replace(/^['"]|['"]$/g, "");
  return value || undefined;
}

export function getCloudinaryCloudName() {
  const value = readEnv("CLOUDINARY_CLOUD_NAME");
  if (!value) {
    throw new Error("CLOUDINARY_CLOUD_NAME is not set.");
  }
  return value;
}

export function getCloudinaryApiKey() {
  const value = readEnv("CLOUDINARY_API_KEY");
  if (!value) {
    throw new Error("CLOUDINARY_API_KEY is not set.");
  }
  return value;
}

export function getCloudinaryApiSecret() {
  const value = readEnv("CLOUDINARY_API_SECRET");
  if (!value) {
    throw new Error("CLOUDINARY_API_SECRET is not set.");
  }
  return value;
}

export function isCloudinaryConfigured() {
  return Boolean(
    readEnv("CLOUDINARY_CLOUD_NAME") &&
      readEnv("CLOUDINARY_API_KEY") &&
      readEnv("CLOUDINARY_API_SECRET")
  );
}
