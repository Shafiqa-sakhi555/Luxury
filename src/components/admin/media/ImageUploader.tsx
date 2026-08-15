"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { AdminButton, AdminLabel } from "@/components/admin/ui";
import type { AdminHeroImage } from "@/types/media";
import { useCloudinaryUpload } from "@/components/admin/media/use-cloudinary-upload";

type ImageUploaderProps = {
  label?: string;
  value: AdminHeroImage;
  onChange: (value: AdminHeroImage) => void;
  categorySlug?: string | null;
};

export function ImageUploader({
  label = "Hero image",
  value,
  onChange,
  categorySlug,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, deleteFile } = useCloudinaryUpload();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const canUpload = Boolean(categorySlug?.trim());

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    if (!canUpload || !categorySlug) {
      setError("Enter a category name/slug before uploading the hero image.");
      return;
    }

    setError(null);
    setBusy(true);
    setProgress(0);

    try {
      const uploaded = await uploadFile(file, {
        context: {
          type: "category",
          categorySlug,
        },
        onProgress: setProgress,
      });

      if (value?.publicId && value.publicId !== uploaded.publicId) {
        await deleteFile(value.publicId).catch(() => undefined);
      }

      onChange({
        url: uploaded.secureUrl,
        publicId: uploaded.publicId,
      });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setBusy(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!value) return;
    setError(null);
    setBusy(true);

    try {
      if (value.publicId) {
        await deleteFile(value.publicId).catch(() => undefined);
      }
      onChange(null);
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Could not remove image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <AdminLabel>{label}</AdminLabel>

      {!canUpload && (
        <p className="text-xs text-amber-700">
          Images upload to{" "}
          <code className="rounded bg-amber-50 px-1">jalals-home-solution/categories/&lt;category-slug&gt;/hero</code>{" "}
          once the category slug is set.
        </p>
      )}

      {value ? (
        <div className="overflow-hidden rounded-xl border border-navy/10 bg-white">
          <div className="relative aspect-[16/9] w-full bg-brand-50">
            <Image
              src={value.url}
              alt="Uploaded hero image"
              fill
              className="object-cover"
              sizes="480px"
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-navy/10 p-3">
            <p className="truncate text-xs text-muted">{value.publicId}</p>
            <div className="flex gap-2">
              <AdminButton
                type="button"
                variant="outline"
                size="sm"
                disabled={busy || !canUpload}
                onClick={() => inputRef.current?.click()}
              >
                Replace
              </AdminButton>
              <AdminButton
                type="button"
                variant="destructive"
                size="sm"
                disabled={busy}
                onClick={handleRemove}
              >
                <Trash2 className="h-4 w-4" />
              </AdminButton>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy || !canUpload}
          onClick={() => inputRef.current?.click()}
          className="flex min-h-40 w-full flex-col items-center justify-center rounded-xl border border-dashed border-navy/20 bg-brand-50/60 px-4 py-8 text-center transition hover:border-navy/40 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="mb-2 h-6 w-6 animate-spin text-navy" />
              <span className="text-sm text-navy">Uploading{progress !== null ? ` ${progress}%` : "..."}</span>
            </>
          ) : (
            <>
              <ImagePlus className="mb-2 h-6 w-6 text-navy" />
              <span className="text-sm font-medium text-navy">Upload hero image</span>
              <span className="mt-1 text-xs text-muted">JPG, PNG, or WEBP up to 5 MB</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        disabled={!canUpload}
        onChange={(event) => handleFiles(event.target.files)}
      />

      {error && <p className="text-xs text-red">{error}</p>}
    </div>
  );
}
