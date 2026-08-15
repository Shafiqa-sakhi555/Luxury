import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteCloudinaryImage } from "@/lib/cloudinary";
import { getUploadErrorMessage } from "@/lib/cloudinary/errors";
import {
  isBannerCloudinaryPublicId,
  isCategoryCloudinaryPublicId,
  isLegacyCloudinaryPublicId,
} from "@/lib/cloudinary/paths";
import { isCloudinaryConfigured } from "@/lib/cloudinary/env";
import { requirePermission } from "@/server/rbac";

const schema = z.object({
  publicId: z.string().min(1),
});

function requiredPermissionForPublicId(publicId: string) {
  if (isCategoryCloudinaryPublicId(publicId) || isBannerCloudinaryPublicId(publicId)) {
    return "catalog.write";
  }
  return "product.write";
}

export async function DELETE(request: Request) {
  try {
    if (!isCloudinaryConfigured()) {
      return NextResponse.json({ error: "Cloudinary is not configured." }, { status: 503 });
    }

    const body = schema.parse(await request.json());

    if (isLegacyCloudinaryPublicId(body.publicId)) {
      await requirePermission("product.write");
    } else {
      await requirePermission(requiredPermissionForPublicId(body.publicId));
    }

    await deleteCloudinaryImage(body.publicId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    console.error("[media/delete]", error);
    const message = getUploadErrorMessage(error);
    const status = message === "Forbidden" || message === "Unauthorized" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
