import "server-only";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCategorySlugById } from "@/server/catalog/cloudinary-upload-context";
import { persistProductImages } from "@/server/catalog/product-image-sync";

export async function repairMissingProductImages() {
  const supabase = createSupabaseAdminClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, category_id, product_images ( id )")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  let repaired = 0;

  for (const product of products ?? []) {
    const imageRows = Array.isArray(product.product_images)
      ? product.product_images
      : product.product_images
        ? [product.product_images]
        : [];

    if (imageRows.length > 0) continue;

    const categorySlug = await getCategorySlugById(product.category_id);
    if (!categorySlug) continue;

    const saved = await persistProductImages({
      productId: product.id,
      categorySlug,
      images: [],
      alt: product.name,
    });

    if (saved.length > 0) {
      repaired += 1;
    }
  }

  revalidatePath("/admin/catalog/products");
  revalidatePath("/shop");

  return { repaired, scanned: products?.length ?? 0 };
}
