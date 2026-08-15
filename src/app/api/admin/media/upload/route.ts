import { NextResponse } from "next/server";
import { z } from "zod";
import { uploadImageBuffer } from "@/lib/cloudinary";
import { CLOUDINARY_UPLOAD_TYPES } from "@/lib/cloudinary/constants";
import { getUploadErrorMessage } from "@/lib/cloudinary/errors";
import { isCloudinaryConfigured } from "@/lib/cloudinary/env";
import { requirePermission } from "@/server/rbac";
import { resolveCloudinaryUploadTarget } from "@/server/catalog/cloudinary-upload-context";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const EXTENSION_MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const uploadContextSchema = z.object({
  uploadType: z.enum(CLOUDINARY_UPLOAD_TYPES),
  categorySlug: z.string().optional(),
  categoryId: z.string().optional(),
  productId: z.string().optional(),
  draftKey: z.string().optional(),
  imageIndex: z.coerce.number().int().min(0).optional(),
  bannerKey: z.string().optional(),
});

function resolveMimeType(file: File): string | null {
  if (ALLOWED_MIME_TYPES.has(file.type)) {
    return file.type;
  }

  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  return EXTENSION_MIME_TYPES[extension] ?? null;
}

function requiredPermissionForUpload(uploadType: z.infer<typeof uploadContextSchema>["uploadType"]) {
  if (uploadType === "category" || uploadType === "banner") {
    return "catalog.write";
  }
  return "product.write";
}

export async function POST(request: Request) {
  try {
    if (!isCloudinaryConfigured()) {
      return NextResponse.json({ error: "Cloudinary is not configured." }, { status: 503 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const context = uploadContextSchema.parse({
      uploadType: String(formData.get("uploadType") ?? "product"),
      categorySlug: formData.get("categorySlug") ? String(formData.get("categorySlug")) : undefined,
      categoryId: formData.get("categoryId") ? String(formData.get("categoryId")) : undefined,
      productId: formData.get("productId") ? String(formData.get("productId")) : undefined,
      draftKey: formData.get("draftKey") ? String(formData.get("draftKey")) : undefined,
      imageIndex: formData.get("imageIndex") ?? undefined,
      bannerKey: formData.get("bannerKey") ? String(formData.get("bannerKey")) : undefined,
    });

    await requirePermission(requiredPermissionForUpload(context.uploadType));

    const mimeType = resolveMimeType(file);
    if (!mimeType) {
      return NextResponse.json(
        { error: "Unsupported file type. Use JPG, PNG, or WEBP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds the 5 MB limit." }, { status: 400 });
    }

    const target = await resolveCloudinaryUploadTarget(context);
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadImageBuffer(buffer, {
      publicId: target.publicId,
      mimeType,
      overwrite: target.overwrite,
    });

    return NextResponse.json({
      secure_url: uploaded.secureUrl,
      public_id: uploaded.publicId,
      width: uploaded.width,
      height: uploaded.height,
      folder: target.folder,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
    }
    console.error("[media/upload]", error);
    const message = getUploadErrorMessage(error);
    const status = message === "Forbidden" || message === "Unauthorized" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
