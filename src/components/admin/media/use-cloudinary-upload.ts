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

type UploadOptions = {
  folder: string;
  onProgress?: (progress: number) => void;
};

function validateFile(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Unsupported file type. Use JPG, PNG, or WEBP.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File exceeds the 5 MB limit.");
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
      formData.append("folder", options.folder);

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
