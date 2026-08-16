"use client";

import { useCallback, useState } from "react";
import type { CloudinaryUploadResult } from "@/types/media";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export type CloudinaryUploadContext =
  | {
      type: "product";
      categorySlug?: string;
      categoryId?: string;
      productId?: string;
      draftKey?: string;
      imageIndex: number;
    }
  | {
      type: "category";
      categorySlug: string;
    }
  | {
      type: "banner";
      bannerKey?: string;
    };

type UploadOptions = {
  context: CloudinaryUploadContext;
  onProgress?: (progress: number) => void;
};

function validateFile(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
    if (!allowedExtensions.has(extension)) {
      throw new Error("Unsupported file type. Use JPG, PNG, or WEBP.");
    }
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File exceeds the 5 MB limit.");
  }
}

function appendUploadContext(formData: FormData, context: CloudinaryUploadContext) {
  formData.append("uploadType", context.type);

  if (context.type === "product") {
    if (context.categorySlug) formData.append("categorySlug", context.categorySlug);
    if (context.categoryId) formData.append("categoryId", context.categoryId);
    if (context.productId) formData.append("productId", context.productId);
    if (context.draftKey) formData.append("draftKey", context.draftKey);
    formData.append("imageIndex", String(context.imageIndex));
    return;
  }

  if (context.type === "category") {
    formData.append("categorySlug", context.categorySlug);
    return;
  }

  if (context.bannerKey) {
    formData.append("bannerKey", context.bannerKey);
  }
}

export function useCloudinaryUpload() {
  const [uploading, setUploading] = useState(false);

  const uploadFile = useCallback(async (file: File, options: UploadOptions) => {
    validateFile(file);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      appendUploadContext(formData, options.context);

      const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/admin/media/upload");
        xhr.responseType = "json";

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable || !options.onProgress) return;
          options.onProgress(Math.round((event.loaded / event.total) * 100));
        };

        xhr.onload = () => {
          const response = xhr.response as
            | {
                secure_url?: string;
                public_id?: string;
                width?: number;
                height?: number;
                error?: string;
              }
            | null;

          if (xhr.status >= 200 && xhr.status < 300 && response?.secure_url && response.public_id) {
            resolve({
              secureUrl: response.secure_url,
              publicId: response.public_id,
              width: response.width ?? 0,
              height: response.height ?? 0,
            });
            return;
          }

          reject(new Error(response?.error ?? "Upload failed."));
        };

        xhr.onerror = () => reject(new Error("Upload failed."));
        xhr.send(formData);
      });

      return result;
    } finally {
      setUploading(false);
    }
  }, []);

  const deleteFile = useCallback(async (publicId: string) => {
    const response = await fetch("/api/admin/media/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error ?? "Could not delete image.");
    }
  }, []);

  return { uploading, uploadFile, deleteFile };
}
