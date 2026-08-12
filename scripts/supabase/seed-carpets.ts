/**
 * Seed Carpets catalog into Supabase (collections + variants).
 * Usage: npm run supabase:seed-carpets
 */
import "dotenv/config";
import { config } from "dotenv";
import path from "node:path";
import fs from "node:fs";
import XLSX from "xlsx";
import { createSupabaseAdminClient } from "../../src/lib/supabase/admin";
import { syncPrismaCarpetCollection } from "../../src/server/catalog/supabase-sync";
import {
  BUCKET,
  clearProductChildren,
  ensureBucket,
  normalizeDiscount,
  pickCollectionFolderImages,
  slugify,
  uploadImage,
  upsertCategory,
} from "./lib/seed-utils";

config({ path: path.join(process.cwd(), ".env.local"), override: true });

const CARPET_ROOT = path.join(process.cwd(), "public/images/category/carpets");
const XLSX_PATH = path.join(CARPET_ROOT, "jala_data_with_descriptions.xlsx");
const IMAGES_PER_COLLECTION = 2;

const COLLECTION_FOLDERS: Record<string, string[]> = {
  "Nagar Rustic Wall-to-Wall Carpet": ["nagar"],
  "Blossom Soft Bloom Wall-to-Wall Carpet": ["blossam"],
  "Persian Royal Wall-to-Wall Carpet": ["persian"],
  "Magestic Regal Wall-to-Wall Carpet": ["magestic"],
  "Fragance Vivid Wall-to-Wall Carpet": ["fragnance"],
  "Tehran Heritage Wall-to-Wall Carpet": ["tehran"],
  "EverGreen Turf Wall-to-Wall Carpet": ["artifical grass"],
  "New Recon F Urban Wall-to-Wall Carpet": [],
  "Sqr Cut Tailored Wall-to-Wall Carpet": ["sqr.cut"],
  "Splash Vibrant Wall-to-Wall Carpet": [],
  "Sniper Bold Wall-to-Wall Carpet": ["sniper"],
  "N.Chips Terrazzo Wall-to-Wall Carpet": ["nova or n.chips"],
  "Reflection Polished Wall-to-Wall Carpet": [],
  "V.Gem Jewel Wall-to-Wall Carpet": ["v.gem"],
  "Graphics Modern Wall-to-Wall Carpet": ["graphics"],
};

type ExcelRow = {
  SKU: string;
  Name: string;
  Category: string;
  Design: string;
  Color: string;
  Quality: string;
  "Regular Price sqr feet": number;
  "Discount %": number;
  "Sale Price": number;
  Stock: number | string;
  Description: string;
};

function collectionRoots(folderNames: string[]) {
  return folderNames.flatMap((folder) => [
    path.join(CARPET_ROOT, folder),
    path.join(CARPET_ROOT, "carpets", folder),
  ]);
}

function stockFromSource(raw: number | string) {
  if (raw === "" || raw === null || raw === undefined) {
    return { quantity: null as number | null, status: "unknown" as const };
  }
  const qty = Number(raw);
  if (!Number.isFinite(qty)) return { quantity: null, status: "unknown" as const };
  return { quantity: qty, status: qty > 0 ? ("in_stock" as const) : ("out_of_stock" as const) };
}

function firstCollectionDescription(rows: ExcelRow[]) {
  const withDescription = rows.find((row) => row.Description?.trim());
  return withDescription?.Description?.trim() ?? null;
}

function shortDescriptionFromCollection(name: string, description: string | null) {
  if (!description) return `${name} — premium wall-to-wall carpet sold by the square foot.`;
  return (
    description.split("\n").find((line) => line.trim() && !line.startsWith("*"))?.trim() ??
    description.slice(0, 180)
  );
}

async function main() {
  console.log("🚀 Seeding Carpets catalog to Supabase...\n");

  if (!fs.existsSync(XLSX_PATH)) {
    throw new Error(`Missing source file: ${XLSX_PATH}`);
  }

  const workbook = XLSX.readFile(XLSX_PATH);
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(workbook.Sheets[workbook.SheetNames[0]], {
    defval: "",
  });

  const grouped = new Map<string, ExcelRow[]>();
  for (const row of rows) {
    if (!row.Name || !row.SKU) continue;
    const list = grouped.get(row.Name) ?? [];
    list.push(row);
    grouped.set(row.Name, list);
  }

  const supabase = createSupabaseAdminClient();
  await ensureBucket(supabase);

  const category = await upsertCategory(supabase, {
    name: "Carpets",
    slug: "carpets",
    description:
      "Premium wall-to-wall carpet collections — sold by the square foot with customizable length and fixed-width installation.",
  });

  console.log(`✓ Category "carpets" (${category.id})`);
  console.log(`✓ Source rows: ${rows.length}`);
  console.log(`✓ Collections: ${grouped.size}\n`);

  let variantCount = 0;
  let imageCount = 0;
  let collectionsWithoutImages = 0;

  for (const [collectionName, collectionRows] of grouped.entries()) {
    const collectionSlug = slugify(collectionName);
    const description = firstCollectionDescription(collectionRows);
    const shortDescription = shortDescriptionFromCollection(collectionName, description);
    const minSale = Math.min(...collectionRows.map((row) => Number(row["Sale Price"])));
    const minOriginal = Math.min(...collectionRows.map((row) => Number(row["Regular Price sqr feet"])));
    const maxDiscount = Math.max(...collectionRows.map((row) => normalizeDiscount(row["Discount %"])));

    console.log(`→ ${collectionName} (${collectionRows.length} variants)`);

    const { data: product, error: productError } = await supabase
      .from("products")
      .upsert(
        {
          category_id: category.id,
          name: collectionName,
          slug: collectionSlug,
          short_description: shortDescription,
          description,
          original_price: minOriginal,
          sale_price: minSale,
          discount_percentage: maxDiscount,
          currency: "PKR",
          selling_unit: "Sold by the Square Foot",
          included_items: null,
          size: "Custom length · fixed width",
          fabric: collectionRows[0]?.Quality ?? null,
          design: null,
          sku: null,
          has_variants: true,
          is_active: true,
          is_featured: true,
        },
        { onConflict: "slug" }
      )
      .select("id")
      .single();

    if (productError || !product) {
      throw new Error(`Collection upsert failed (${collectionSlug}): ${productError?.message}`);
    }

    await clearProductChildren(supabase, product.id);

    const folderNames = COLLECTION_FOLDERS[collectionName] ?? [];
    const roots = collectionRoots(folderNames);
    const localCollectionImages = pickCollectionFolderImages(roots, IMAGES_PER_COLLECTION);

    const collectionImages: Array<{ url: string; alt: string; sortOrder: number }> = [];
    for (let i = 0; i < localCollectionImages.length; i++) {
      const localPath = localCollectionImages[i];
      const fileName = path.basename(localPath).replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
      const storagePath = `carpets/${collectionSlug}/gallery/${fileName}`;
      const publicUrl = await uploadImage(supabase, localPath, storagePath);
      collectionImages.push({ url: publicUrl, alt: collectionName, sortOrder: i });

      await supabase.from("product_images").insert({
        product_id: product.id,
        variant_id: null,
        image_url: publicUrl,
        alt_text: `${collectionName} — image ${i + 1}`,
        sort_order: i,
        is_primary: i === 0,
      });
      imageCount++;
    }

    if (collectionImages.length === 0) collectionsWithoutImages++;

    const prismaVariants: Array<{
      supabaseVariantId: string;
      sku: string;
      name: string;
      originalPriceMinor: number;
      salePriceMinor: number;
      images: Array<{ url: string; alt: string; sortOrder: number }>;
    }> = [];

    for (let index = 0; index < collectionRows.length; index++) {
      const row = collectionRows[index];
      const design = String(row.Design ?? "").trim();
      const color = String(row.Color ?? "").trim();
      const variantName = design ? `Design ${design}${color ? ` · ${color}` : ""}` : color || row.SKU;
      const originalPrice = Number(row["Regular Price sqr feet"]);
      const salePrice = Number(row["Sale Price"]);
      const discount = normalizeDiscount(row["Discount %"]);
      const stock = stockFromSource(row.Stock);

      const { data: variant, error: variantError } = await supabase
        .from("product_variants")
        .upsert(
          {
            product_id: product.id,
            sku: row.SKU,
            name: variantName,
            design,
            color,
            quality: row.Quality,
            size: "Custom length · fixed width",
            original_price: originalPrice,
            sale_price: salePrice,
            discount_percentage: discount,
            sort_order: index,
            is_active: true,
            is_default: index === 0,
          },
          { onConflict: "sku" }
        )
        .select("id")
        .single();

      if (variantError || !variant) {
        throw new Error(`Variant upsert failed (${row.SKU}): ${variantError?.message}`);
      }

      await supabase.from("product_variant_inventory").delete().eq("variant_id", variant.id);
      await supabase.from("product_variant_inventory").insert({
        variant_id: variant.id,
        stock_quantity: stock.quantity,
        stock_status: stock.status,
      });

      prismaVariants.push({
        supabaseVariantId: variant.id,
        sku: row.SKU,
        name: variantName,
        originalPriceMinor: Math.round(originalPrice * 100),
        salePriceMinor: Math.round(salePrice * 100),
        images: collectionImages,
      });

      variantCount++;
    }

    await syncPrismaCarpetCollection({
      supabaseProductId: product.id,
      name: collectionName,
      slug: collectionSlug,
      shortDescription,
      description,
      categorySlug: "carpets",
      primaryImageUrl: collectionImages[0]?.url ?? null,
      variants: prismaVariants,
    });

    console.log(
      `  ✓ ${collectionRows.length} variants, ${collectionImages.length} collection images\n`
    );
  }

  console.log("✅ Carpets seed complete");
  console.log(`   Collections: ${grouped.size}`);
  console.log(`   Variants:    ${variantCount}`);
  console.log(`   Images:      ${imageCount}`);
  console.log(`   Collections without local images: ${collectionsWithoutImages}`);
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
