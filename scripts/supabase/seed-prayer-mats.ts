/**
 * Seed Prayer Mats catalog into Supabase.
 * Usage: npm run supabase:seed-prayer-mats
 */
import "dotenv/config";
import { config } from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { createSupabaseAdminClient } from "../../src/lib/supabase/admin";
import { syncPrismaVariantForSupabaseProduct } from "../../src/server/catalog/supabase-sync";
import {
  BUCKET,
  ensureBucket,
  slugify,
  uploadImage,
  upsertCategory,
} from "./lib/seed-utils";

config({ path: path.join(process.cwd(), ".env.local"), override: true });

const ROOT = path.join(process.cwd(), "public/images/category/praying mates");

type PrayerMatSeed = {
  sku: string;
  name: string;
  design: string;
  color: string;
  quality: string;
  trackNo: string;
  imageFiles: string[];
  originalPrice: number;
  salePrice: number;
  discountPercentage: number;
  stock: number;
  shortDescription: string;
  description: string;
};

const PRAYER_MATS: PrayerMatSeed[] = [
  {
    sku: "RUG-VK-GARNET-C012A",
    name: "Granet Mustard Gold Arch Prayer Mat",
    design: "C012A",
    color: "Mustard Gold",
    quality: "NEW GRANET",
    trackNo: "25080018",
    imageFiles: ["DesignC012A.jpeg", "DesignC012A(1).jpeg", "ai design C012A.png"],
    originalPrice: 7000,
    salePrice: 5000,
    discountPercentage: 29,
    stock: 1,
    shortDescription:
      "Rich mustard-gold prayer mat with a classic mihrab arch and red-cream floral border.",
    description:
      "Rich mustard-gold prayer mat with a classic mihrab arch and red-cream floral border. Hand-finished with fine detailing along every edge and soft, plush pile that stays comfortable through daily use.",
  },
  {
    sku: "RUG-VK-GARNET-U021A",
    name: "Granet Ivory Beige Mihrab Prayer Mat",
    design: "U021A",
    color: "Ivory Beige",
    quality: "GRANET",
    trackNo: "25090029",
    imageFiles: ["design U021A.png", "U021A(1).png", "ai U021A.jpg"],
    originalPrice: 7000,
    salePrice: 5000,
    discountPercentage: 29,
    stock: 1,
    shortDescription:
      "Elegant ivory-beige prayer mat featuring an intricate mihrab design with warm floral trim.",
    description:
      "Elegant ivory-beige prayer mat featuring an intricate mihrab design with warm floral trim. A timeless, versatile piece that complements any home decor while offering a soft, cushioned surface for prayer.",
  },
  {
    sku: "RUG-VK-GARNET-U021B",
    name: "Granet Navy Blue Lattice Prayer Mat",
    design: "U021B",
    color: "Navy Blue",
    quality: "GRANET",
    trackNo: "25990029",
    imageFiles: ["U021B.jpeg", "U021B(1).jpeg", "ai gen U021B.png"],
    originalPrice: 7000,
    salePrice: 5000,
    discountPercentage: 29,
    stock: 1,
    shortDescription:
      "Deep navy prayer mat with a gold lattice pattern and richly detailed mihrab arch border.",
    description:
      "Deep navy prayer mat with a gold lattice pattern and richly detailed mihrab arch border. A striking, jewel-toned addition to any prayer space, woven with durable, easy-care fibers.",
  },
];

async function main() {
  console.log("🚀 Seeding Prayer Mats catalog to Supabase...\n");

  for (const product of PRAYER_MATS) {
    for (const file of product.imageFiles) {
      const full = path.join(ROOT, file);
      if (!fs.existsSync(full)) throw new Error(`Missing image: ${full}`);
    }
  }

  const supabase = createSupabaseAdminClient();
  await ensureBucket(supabase);

  const category = await upsertCategory(supabase, {
    name: "Prayer Mats",
    slug: "prayer-mats",
    description:
      "Premium granet prayer mats with classic mihrab designs — soft, durable, and available in elegant colorways.",
  });

  console.log(`✓ Category "prayer-mats" (${category.id})\n`);

  let totalImages = 0;

  for (const product of PRAYER_MATS) {
    const slug = slugify(product.name);
    console.log(`→ ${product.name}`);

    const { data: row, error: productError } = await supabase
      .from("products")
      .upsert(
        {
          category_id: category.id,
          name: product.name,
          slug,
          short_description: product.shortDescription,
          description: product.description,
          original_price: product.originalPrice,
          sale_price: product.salePrice,
          discount_percentage: product.discountPercentage,
          currency: "PKR",
          selling_unit: "Sold individually",
          included_items: "1 prayer mat",
          size: "80 x 120 CM",
          fabric: product.quality,
          design: product.design,
          sku: product.sku,
          has_variants: false,
          is_active: true,
          is_featured: true,
        },
        { onConflict: "slug" }
      )
      .select("id")
      .single();

    if (productError || !row) {
      throw new Error(`Product upsert failed (${slug}): ${productError?.message}`);
    }

    await supabase.from("product_images").delete().eq("product_id", row.id);
    await supabase.from("product_specifications").delete().eq("product_id", row.id);
    await supabase.from("inventory").delete().eq("product_id", row.id);

    const uploadedImages: Array<{ url: string; alt: string; sortOrder: number }> = [];

    for (let i = 0; i < product.imageFiles.length; i++) {
      const file = product.imageFiles[i];
      const localPath = path.join(ROOT, file);
      const safeName = file.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
      const storagePath = `prayer-mats/${slug}/${safeName}`;
      const publicUrl = await uploadImage(supabase, localPath, storagePath);

      uploadedImages.push({ url: publicUrl, alt: product.name, sortOrder: i });

      const { error: imgError } = await supabase.from("product_images").insert({
        product_id: row.id,
        image_url: publicUrl,
        alt_text: `${product.name} — image ${i + 1}`,
        sort_order: i,
        is_primary: i === 0,
      });
      if (imgError) throw new Error(`Image insert failed: ${imgError.message}`);
      totalImages++;
    }

    await supabase.from("inventory").insert({
      product_id: row.id,
      stock_quantity: product.stock,
      stock_status: product.stock > 0 ? "in_stock" : "out_of_stock",
    });

    const specs = [
      { key: "color", value: product.color, order: 0 },
      { key: "quality", value: product.quality, order: 1 },
      { key: "track_no", value: product.trackNo, order: 2 },
    ];

    for (const spec of specs) {
      await supabase.from("product_specifications").insert({
        product_id: row.id,
        spec_key: spec.key,
        spec_value: spec.value,
        sort_order: spec.order,
      });
    }

    await syncPrismaVariantForSupabaseProduct({
      supabaseId: row.id,
      name: product.name,
      slug,
      sku: product.sku,
      shortDescription: product.shortDescription,
      description: product.description,
      originalPriceMinor: product.originalPrice * 100,
      salePriceMinor: product.salePrice * 100,
      categorySlug: "prayer-mats",
      primaryImageUrl: uploadedImages[0]?.url ?? null,
      images: uploadedImages.map((img) => ({
        url: img.url,
        alt: img.alt,
        sortOrder: img.sortOrder,
      })),
    });

    console.log(`  ✓ ${uploadedImages.length} images, stock ${product.stock}\n`);
  }

  console.log("✅ Prayer Mats seed complete");
  console.log(`   Products: ${PRAYER_MATS.length}`);
  console.log(`   Images:   ${totalImages}`);
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err.message);
  process.exit(1);
});
