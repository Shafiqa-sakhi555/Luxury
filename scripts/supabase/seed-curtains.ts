/**
 * Seed the Curtains catalog into Supabase (database + storage).
 *
 * Prerequisites:
 *   1. Run supabase/migrations/001_catalog_schema.sql in your Supabase project
 *   2. Create a public storage bucket named "product-images"
 *   3. Add to .env.local:
 *        NEXT_PUBLIC_SUPABASE_URL=
 *        NEXT_PUBLIC_SUPABASE_ANON_KEY=
 *        SUPABASE_SERVICE_ROLE_KEY=
 *
 * Usage: npm run supabase:seed-curtains
 */
import "dotenv/config";
import { config } from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { createSupabaseAdminClient } from "../../src/lib/supabase/admin";
import { syncPrismaVariantForSupabaseProduct } from "../../src/server/catalog/supabase-sync";

config({ path: path.join(process.cwd(), ".env.local"), override: true });

const BUCKET = "product-images";
const MIN_IMAGES = 2;
const IMAGES_PER_PRODUCT = 3;
const CURTAINS_ROOT = path.join(process.cwd(), "public/images/category/curtains");

type CurtainSeed = {
  slug: string;
  sku: string;
  name: string;
  folder: string;
  storageFolder: string;
  imageFiles: string[];
  originalPrice: number;
  salePrice: number;
  discountPercentage: number;
  shortDescription: string;
  description: string;
  sellingUnit: string;
  includedItems: string;
  size: string;
  fabric: string;
  design: string;
  colors: string;
  stockPerColor: number;
};

const CURTAINS: CurtainSeed[] = [
  {
    slug: "towel-fabric-curtains",
    sku: "Curtains-Towel-fabric",
    name: "Towel Fabric Curtains",
    folder: "towel fabrics",
    storageFolder: "curtains/towel-fabrics",
    imageFiles: [
      "image 1.jpeg",
      "image 2.jpeg",
      "image 3.jpeg",
    ],
    originalPrice: 2800,
    salePrice: 2500,
    discountPercentage: 11,
    shortDescription:
      "Soft plush texture meets everyday durability. These versatile curtains bring warmth and depth to any window — perfect for cozy, relaxed interiors.",
    description:
      "Transform your room with these timeless towel-fabric curtains. Crafted from a soft, plush toweling weave, they bring a warm, tactile texture that feels as good as it looks. The subtle looped surface adds visual depth and a relaxed, cozy character that complements coastal, modern, or classic interiors. Durable and easy to care for, these curtains offer both style and function for any living space.",
    sellingUnit: "Sold as Pair",
    includedItems: "1 curtain",
    size: "Length 5 ft, Width 8.6 ft",
    fabric: "Toweling weave",
    design: "Eyelet, stainless steel ring",
    colors: "Grey, Blue, Cream, White, Red",
    stockPerColor: 20,
  },
  {
    slug: "malai-curtains",
    sku: "Curtains-Malai-curtains",
    name: "Malai Curtains",
    folder: "malai curtains",
    storageFolder: "curtains/malai-curtains",
    imageFiles: [
      "WhatsApp Image 2026-08-08 at 2.10.13 PM.jpeg",
      "WhatsApp Image 2026-08-08 at 2.10.14 PM.jpeg",
      "WhatsApp Image 2026-08-08 at 2.10.16 PM.jpeg",
    ],
    originalPrice: 2400,
    salePrice: 1800,
    discountPercentage: 25,
    shortDescription:
      "Rich velvet feel meets soft, everyday comfort. These curtains combine luxurious texture with easy maintenance — perfect for elegant, statement-making interiors.",
    description:
      "Elevate your room with these rich Malai velvet curtains. Crafted from a smooth, soft velvet-finish fabric, they blend timeless luxury with everyday practicality. The deep, even pile adds visual depth and a refined sheen that complements contemporary, classic, or glam interiors. Durable and easy to care for, these curtains offer both style and function for any living space.",
    sellingUnit: "Sold as Pair",
    includedItems: "1 curtain",
    size: "Length 5 ft, Width 8.6 ft",
    fabric: "Velvet weave",
    design: "Eyelet, stainless steel ring",
    colors:
      "Black, Blue, White, Maroon, Red, Pink, Green, Grey, Light Brown, Offwhite, Light Grey",
    stockPerColor: 20,
  },
  {
    slug: "bubble-curtains",
    sku: "Curtains-Bubble-curtains",
    name: "Bubble Curtains",
    folder: "bubble",
    storageFolder: "curtains/bubble",
    imageFiles: [
      "WhatsApp Image 2026-08-09 at 9.21.40 AM.jpeg",
      "WhatsApp Image 2026-08-09 at 9.21.40 AM (1).jpeg",
      "WhatsApp Image 2026-08-09 at 9.21.40 AM (2).jpeg",
    ],
    originalPrice: 2200,
    salePrice: 1650,
    discountPercentage: 25,
    shortDescription:
      "Delicate texture meets soft, filtered light. These sheer curtains combine airy elegance with easy maintenance — perfect for bright, breezy interiors.",
    description:
      "Brighten your room with these delicate Bubble curtains. Crafted from a lightweight, sheer dobby weave with a raised dot texture, they blend soft, airy elegance with everyday practicality. The subtle bubble pattern adds visual depth while gently filtering natural light, complementing coastal, modern, or romantic interiors. Durable and easy to care for, these curtains offer both style and function for any living space.",
    sellingUnit: "Sold as Pair",
    includedItems: "1 curtain",
    size: "Length 5 ft, Width 8.6 ft",
    fabric: "Sheer dobby bubble weave",
    design: "Eyelet, stainless steel ring",
    colors: "Blue, Green, Grey, Pink, Orange, Sky Blue, Brown, Purple",
    stockPerColor: 20,
  },
  {
    slug: "moon-curtains",
    sku: "Curtains-Moon-curtains",
    name: "Moon Curtains",
    folder: "moon",
    storageFolder: "curtains/moon",
    imageFiles: [
      "WhatsApp Image 2026-08-09 at 8.52.57 AM.jpeg",
      "WhatsApp Image 2026-08-09 at 8.52.58 AM.jpeg",
      "WhatsApp Image 2026-08-09 at 8.53.00 AM.jpeg",
    ],
    originalPrice: 2200,
    salePrice: 1650,
    discountPercentage: 25,
    shortDescription:
      "Clean matte texture meets soft, everyday comfort. These versatile curtains combine understated style with easy maintenance — perfect for modern, minimalist interiors.",
    description:
      "Refresh your room with these versatile Moon curtains. Crafted from a soft matte textured weave, they blend clean, understated style with everyday practicality. The smooth finish adds visual depth and a calm, contemporary feel that complements minimalist, modern, or classic interiors. Durable and easy to care for, these curtains offer both style and function for any living space.",
    sellingUnit: "Sold as Pair",
    includedItems: "1 curtain",
    size: "Length 5 ft, Width 8.6 ft",
    fabric: "Matte textured weave",
    design: "Eyelet, stainless steel ring",
    colors: "Green, Grey, Brown, Light Grey, Dark Grey, Offwhite, Orange, Cyan",
    stockPerColor: 20,
  },
  {
    slug: "new-parday-curtains",
    sku: "Curtains-New-Parday",
    name: "New Parday Curtains",
    folder: "new parday",
    storageFolder: "curtains/new-parday",
    imageFiles: ["image 1.jpeg", "image 2.jpeg", "image 3.jpeg"],
    originalPrice: 3200,
    salePrice: 2500,
    discountPercentage: 22,
    shortDescription:
      "Classic linen texture meets soft, everyday practicality. These versatile curtains combine timeless style with easy maintenance — perfect for breezy coastal looks or clean modern interiors.",
    description:
      "Transform your room with these timeless New Parday curtains. Crafted from a soft, breathable linen-look weave, they blend classic style with everyday practicality. The natural fiber texture adds visual depth and a refreshing contrast that complements coastal, modern, or classic interiors. Durable and easy to care for, these curtains offer both style and function for any living space.",
    sellingUnit: "Sold as Pair",
    includedItems: "1 curtain",
    size: "Length 5 ft, Width 8.6 ft",
    fabric: "Linen-weave textured",
    design: "Eyelet, stainless steel ring",
    colors: "Cream, White, Beige, Green, Silver",
    stockPerColor: 20,
  },
  {
    slug: "palachi-curtains",
    sku: "Curtains-Palachi",
    name: "Palachi Curtains",
    folder: "palachi",
    storageFolder: "curtains/palachi",
    imageFiles: [
      "WhatsApp Image 2026-08-09 at 8.55.33 AM.jpeg",
      "WhatsApp Image 2026-08-09 at 8.55.33 AM (1).jpeg",
      "WhatsApp Image 2026-08-09 at 8.55.34 AM.jpeg",
    ],
    originalPrice: 2400,
    salePrice: 1800,
    discountPercentage: 25,
    shortDescription:
      "Refined jacquard detail meets soft, everyday elegance. These versatile curtains combine subtle pattern with easy maintenance — perfect for classic or transitional interiors.",
    description:
      "Elevate your room with these refined Palachi curtains. Crafted from a jacquard and sheer weave blend, they bring subtle textured elegance with everyday practicality. The intricate pattern detail adds visual depth and a soft, sophisticated finish that complements classic, transitional, or elegant interiors. Durable and easy to care for, these curtains offer both style and function for any living space.",
    sellingUnit: "Sold as Pair",
    includedItems: "1 curtain",
    size: "Length 5 ft, Width 8.6 ft",
    fabric: "Jacquard & sheer weave",
    design: "Eyelet, stainless steel ring",
    colors: "Pink, Grey, Silver, White, Offwhite, Purple",
    stockPerColor: 20,
  },
  {
    slug: "net-curtains",
    sku: "Curtains-Net",
    name: "Net Curtains",
    folder: "net curatins",
    storageFolder: "curtains/net-curtains",
    imageFiles: ["image 5.jpeg", "image 6.jpeg", "image 7.jpeg"],
    originalPrice: 1800,
    salePrice: 1500,
    discountPercentage: 17,
    shortDescription:
      "Natural linen-look texture meets soft, everyday practicality. These versatile curtains combine understated style with easy maintenance — perfect for bright, airy interiors.",
    description:
      "Refresh your room with these natural Net curtains. Crafted from a soft, breathable linen-look weave, they blend clean, understated style with everyday practicality. The natural texture adds visual depth and a light, airy contrast that complements coastal, modern, or classic interiors. Durable and easy to care for, these curtains offer both style and function for any living space.",
    sellingUnit: "Sold as Pair",
    includedItems: "1 curtain",
    size: "Length 5 ft, Width 8.6 ft",
    fabric: "Linen-weave textured",
    design: "Eyelet, stainless steel ring",
    colors: "Grey, White, Offwhite",
    stockPerColor: 20,
  },
];

function contentType(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

async function ensureBucket(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error && !error.message.includes("already exists")) {
      throw new Error(`Failed to create bucket: ${error.message}`);
    }
  }
}

async function uploadImage(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  localPath: string,
  storagePath: string
) {
  const buffer = fs.readFileSync(localPath);
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: contentType(localPath),
    upsert: true,
  });
  if (error) throw new Error(`Upload failed (${storagePath}): ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function main() {
  console.log("🚀 Seeding Curtains catalog to Supabase...\n");

  const supabase = createSupabaseAdminClient();
  await ensureBucket(supabase);

  // Validate local images before any remote writes
  for (const product of CURTAINS) {
    const dir = path.join(CURTAINS_ROOT, product.folder);
    for (const file of product.imageFiles) {
      const full = path.join(dir, file);
      if (!fs.existsSync(full)) {
        throw new Error(`Missing image: ${full}`);
      }
    }
    if (product.imageFiles.length < MIN_IMAGES) {
      throw new Error(
        `Folder "${product.folder}" has fewer than ${MIN_IMAGES} images (${product.imageFiles.length}).`
      );
    }
  }

  // Category
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .upsert(
      {
        name: "Curtains",
        slug: "curtains",
        description:
          "Premium machine-made curtains — towel fabric, velvet, sheer, linen-look and jacquard weaves. Sold as pairs with eyelet headers.",
        is_active: true,
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (categoryError || !category) {
    throw new Error(`Category upsert failed: ${categoryError?.message}`);
  }

  console.log(`✓ Category "curtains" (${category.id})\n`);

  let totalImages = 0;

  for (const product of CURTAINS) {
    console.log(`→ ${product.name}`);

    const { data: row, error: productError } = await supabase
      .from("products")
      .upsert(
        {
          category_id: category.id,
          name: product.name,
          slug: product.slug,
          short_description: product.shortDescription,
          description: product.description,
          original_price: product.originalPrice,
          sale_price: product.salePrice,
          discount_percentage: product.discountPercentage,
          currency: "PKR",
          selling_unit: product.sellingUnit,
          included_items: product.includedItems,
          size: product.size,
          fabric: product.fabric,
          design: product.design,
          sku: product.sku,
          is_active: true,
          is_featured: true,
        },
        { onConflict: "slug" }
      )
      .select("id")
      .single();

    if (productError || !row) {
      throw new Error(`Product upsert failed (${product.slug}): ${productError?.message}`);
    }

    await supabase.from("product_images").delete().eq("product_id", row.id);
    await supabase.from("product_specifications").delete().eq("product_id", row.id);
    await supabase.from("inventory").delete().eq("product_id", row.id);

    const uploadedImages: Array<{ url: string; alt: string; sortOrder: number }> = [];

    for (let i = 0; i < product.imageFiles.length; i++) {
      const file = product.imageFiles[i];
      const localPath = path.join(CURTAINS_ROOT, product.folder, file);
      const safeName = file.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
      const storagePath = `${product.storageFolder}/${safeName}`;

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

    const colorCount = product.colors.split(",").length;
    const stockQty = colorCount * product.stockPerColor;

    await supabase.from("inventory").insert({
      product_id: row.id,
      stock_quantity: stockQty,
      stock_status: stockQty > 0 ? "in_stock" : "out_of_stock",
    });

    const specs = [
      { key: "colors", value: product.colors, order: 0 },
      { key: "quality", value: product.fabric, order: 1 },
      { key: "design_detail", value: product.design, order: 2 },
    ];

    for (const spec of specs) {
      await supabase.from("product_specifications").insert({
        product_id: row.id,
        spec_key: spec.key,
        spec_value: spec.value,
        sort_order: spec.order,
      });
    }

    // Sync Prisma variant for cart/checkout bridge
    await syncPrismaVariantForSupabaseProduct({
      supabaseId: row.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      shortDescription: product.shortDescription,
      description: product.description,
      originalPriceMinor: product.originalPrice * 100,
      salePriceMinor: product.salePrice * 100,
      categorySlug: "curtains",
      primaryImageUrl: uploadedImages[0]?.url ?? null,
      images: uploadedImages.map((img) => ({
        url: img.url,
        alt: img.alt,
        sortOrder: img.sortOrder,
      })),
    });

    console.log(`  ✓ ${uploadedImages.length} images, stock ${stockQty}\n`);
  }

  console.log("✅ Seed complete");
  console.log(`   Products: ${CURTAINS.length}`);
  console.log(`   Images:   ${totalImages}`);
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err.message);
  process.exit(1);
});
