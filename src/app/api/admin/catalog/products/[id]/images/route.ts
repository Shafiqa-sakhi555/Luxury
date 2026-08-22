import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/server/rbac";
import { getCategorySlugById } from "@/server/catalog/cloudinary-upload-context";
import { persistProductImages } from "@/server/catalog/product-image-sync";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidateStorefrontCatalog } from "@/server/catalog/revalidate-storefront";

const schema = z.object({
  images: z.array(
    z.object({
      url: z.string(),
      publicId: z.string().optional(),
      alt: z.string().optional(),
      sortOrder: z.number().optional(),
    })
  ),
  draftKey: z.string().optional(),
  alt: z.string().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("product.write");
    const { id } = await params;
    const body = schema.parse(await request.json());

    const supabase = createSupabaseAdminClient();
    const { data: product } = await supabase
      .from("products")
      .select("id, name, category_id")
      .eq("id", id)
      .maybeSingle();

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const categorySlug = await getCategorySlugById(product.category_id);
    if (!categorySlug) {
      return NextResponse.json({ error: "Category not found." }, { status: 400 });
    }

    const images = await persistProductImages({
      productId: id,
      categorySlug,
      images: body.images.map((image, index) => ({
        url: image.url,
        publicId: image.publicId ?? "",
        alt: image.alt,
        sortOrder: image.sortOrder ?? index,
      })),
      draftKey: body.draftKey,
      alt: body.alt ?? product.name,
    });

    revalidatePath("/admin/catalog/products");
    revalidatePath(`/admin/catalog/products/${id}`);
    revalidateStorefrontCatalog([categorySlug]);

    return NextResponse.json({ ok: true, images });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid image payload." }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save product images." },
      { status: 500 }
    );
  }
}
