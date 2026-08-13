"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, GripVertical, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { AdminButton, AdminLabel } from "@/components/admin/ui";
import { CLOUDINARY_FOLDERS } from "@/lib/cloudinary/constants";
import type { AdminProductImage } from "@/types/media";
import { useCloudinaryUpload } from "@/components/admin/media/use-cloudinary-upload";

type UploadItem = AdminProductImage & {
  clientId: string;
  uploading?: boolean;
  progress?: number;
};

type ProductImageUploaderProps = {
  value: AdminProductImage[];
  onChange: (images: AdminProductImage[]) => void;
  altFallback?: string;
};

function toUploadItems(images: AdminProductImage[]): UploadItem[] {
  return images.map((image, index) => ({
    ...image,
    clientId: image.publicId || `existing-${index}`,
    sortOrder: index,
  }));
}

function fromUploadItems(items: UploadItem[]): AdminProductImage[] {
  return items
    .filter((item) => item.url && !item.uploading)
    .map((item, index) => ({
      url: item.url,
      publicId: item.publicId,
      alt: item.alt,
      sortOrder: index,
    }));
}

export function ProductImageUploader({
  value,
  onChange,
  altFallback = "Product image",
}: ProductImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, deleteFile } = useCloudinaryUpload();
  const [items, setItems] = useState<UploadItem[]>(() => toUploadItems(value));
  const [draggingOver, setDraggingOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(toUploadItems(value));
  }, [value]);

  function commitItems(nextItems: UploadItem[]) {
    const normalized = nextItems.map((item, index) => ({ ...item, sortOrder: index }));
    setItems(normalized);
    onChange(fromUploadItems(normalized));
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;

    setError(null);

    for (const file of Array.from(files)) {
      const clientId = crypto.randomUUID();

      setItems((current) => [
        ...current,
        {
          clientId,
          url: "",
          publicId: "",
          alt: altFallback,
          sortOrder: current.length,
          uploading: true,
          progress: 0,
        },
      ]);

      try {
        const uploaded = await uploadFile(file, {
          folder: CLOUDINARY_FOLDERS.products,
          onProgress: (progress) => {
            setItems((current) =>
              current.map((item) =>
                item.clientId === clientId ? { ...item, progress, uploading: true } : item
              )
            );
          },
        });

        setItems((current) => {
          const next = current.map((item) =>
            item.clientId === clientId
              ? {
                  ...item,
                  url: uploaded.secureUrl,
                  publicId: uploaded.publicId,
                  uploading: false,
                  progress: 100,
                }
              : item
          );
          onChange(fromUploadItems(next));
          return next;
        });
      } catch (uploadError) {
        setItems((current) => current.filter((item) => item.clientId !== clientId));
        setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
      }
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRemove(item: UploadItem) {
    setError(null);

    if (item.publicId) {
      try {
        await deleteFile(item.publicId);
      } catch (removeError) {
        setError(removeError instanceof Error ? removeError.message : "Could not delete image.");
        return;
      }
    }

    commitItems(items.filter((current) => current.clientId !== item.clientId));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    commitItems(next);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDraggingOver(false);
    uploadFiles(event.dataTransfer.files);
  }

  function handleReorderDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    setDragIndex(null);
    commitItems(next);
  }

  return (
    <div className="space-y-4">
      <AdminLabel>Product images</AdminLabel>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDraggingOver(true);
        }}
        onDragLeave={() => setDraggingOver(false)}
        onDrop={handleDrop}
        className={`rounded-xl border border-dashed px-4 py-8 text-center transition ${
          draggingOver ? "border-navy bg-brand-50" : "border-navy/20 bg-brand-50/50"
        }`}
      >
        <ImagePlus className="mx-auto mb-2 h-6 w-6 text-navy" />
        <p className="text-sm font-medium text-navy">Drag and drop images here</p>
        <p className="mt-1 text-xs text-muted">JPG, PNG, or WEBP up to 5 MB each</p>
        <AdminButton
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => inputRef.current?.click()}
        >
          Select images
        </AdminButton>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(event) => uploadFiles(event.target.files)}
        />
      </div>

      {error && <p className="text-xs text-red">{error}</p>}

      {items.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item, index) => (
            <div
              key={item.clientId}
              draggable={!item.uploading && Boolean(item.url)}
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleReorderDrop(index)}
              className="overflow-hidden rounded-xl border border-navy/10 bg-white"
            >
              <div className="relative aspect-square bg-brand-50">
                {item.uploading ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-navy">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Uploading{item.progress !== undefined ? ` ${item.progress}%` : "..."}
                  </div>
                ) : (
                  <Image
                    src={item.url}
                    alt={item.alt ?? altFallback}
                    fill
                    className="object-cover"
                    sizes="240px"
                  />
                )}
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-navy/10 p-3">
                <div className="flex items-center gap-1 text-muted">
                  <GripVertical className="h-4 w-4" />
                  <span className="text-xs">#{index + 1}</span>
                </div>
                <div className="flex items-center gap-1">
                  <AdminButton
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === 0 || item.uploading}
                    onClick={() => moveItem(index, -1)}
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </AdminButton>
                  <AdminButton
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === items.length - 1 || item.uploading}
                    onClick={() => moveItem(index, 1)}
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </AdminButton>
                  <AdminButton
                    type="button"
                    variant="destructive"
                    size="icon"
                    disabled={item.uploading}
                    onClick={() => handleRemove(item)}
                    aria-label="Remove image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </AdminButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
