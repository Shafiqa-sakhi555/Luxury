import { NextResponse } from "next/server";
import { requirePermission } from "@/server/rbac";
import { repairMissingProductImages } from "@/server/catalog/repair-product-images";

export async function POST() {
  try {
    await requirePermission("product.write");
    const result = await repairMissingProductImages();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Repair failed." },
      { status: 500 }
    );
  }
}
