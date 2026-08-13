export function formatCloudinaryError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.trim()) {
      const httpCode =
        typeof record.http_code === "number" ? ` (HTTP ${record.http_code})` : "";
      return `${record.message}${httpCode}`;
    }
  }

  return "Cloudinary upload failed.";
}

export function getUploadErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return formatCloudinaryError(error);
}
