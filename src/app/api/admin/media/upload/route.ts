import { NextResponse } from "next/server";
import { CLOUDINARY_FOLDERS, type CloudinaryFolder } from "@/lib/cloudinary/constants";
import { uploadImageBuffer } from "@/lib/cloudinary";
import { getUploadErrorMessage } from "@/lib/cloudinary/errors";
import { isCloudinaryConfigured } from "@/lib/cloudinary/env";
import { requirePermission } from "@/server/rbac";

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

function resolveMimeType(file: File): string | null {
  if (ALLOWED_MIME_TYPES.has(file.type)) {
    return file.type;
  }

  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  return EXTENSION_MIME_TYPES[extension] ?? null;
}

function requiredPermissionForFolder(folder: string) {
  if (folder === CLOUDINARY_FOLDERS.categories) {
    return "catalog.write";
  }
  return "product.write";
}

const ALLOWED_FOLDERS = new Set<string>(Object.values(CLOUDINARY_FOLDERS));

function assertAllowedFolder(folder: string): CloudinaryFolder {
  if (!ALLOWED_FOLDERS.has(folder)) {
    throw new Error("Invalid upload folder.");
  }
  return folder as CloudinaryFolder;
}

export async function POST(request: Request) {
  try {
    if (!isCloudinaryConfigured()) {
      return NextResponse.json({ error: "Cloudinary is not configured." }, { status: 503 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const folderInput = String(formData.get("folder") ?? CLOUDINARY_FOLDERS.products);

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const folder = assertAllowedFolder(folderInput);
    await requirePermission(requiredPermissionForFolder(folder));

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

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadImageBuffer(buffer, folder, {
      filename: file.name,
      mimeType,
    });

    return NextResponse.json({
      secure_url: uploaded.secureUrl,
      public_id: uploaded.publicId,
      width: uploaded.width,
      height: uploaded.height,
    });
  } catch (error) {
    console.error("[media/upload]", error);
    const message = getUploadErrorMessage(error);
    const status = message === "Forbidden" || message === "Unauthorized" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
