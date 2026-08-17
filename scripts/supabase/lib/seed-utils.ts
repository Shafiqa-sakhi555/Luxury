import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env") });
config({ path: path.join(process.cwd(), ".env.local"), override: true });

import { CLOUDINARY_ROOT, sanitizeCloudinarySegment } from "../../../src/lib/cloudinary/paths";
import { uploadImageBuffer } from "../../../src/lib/cloudinary/index";
import { createSupabaseAdminClient } from "../../../src/lib/supabase/admin";

export const IMAGES_PER_PRODUCT = 3;

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function contentType(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

export function normalizeDiscount(raw: number | string) {
  const n = typeof raw === "string" ? Number.parseFloat(raw) : raw;
  if (!Number.isFinite(n)) return 0;
  if (n > 0 && n <= 1) return Math.round(n * 100);
  return Math.round(n);
}

export function parsePrice(raw: number | string) {
  if (typeof raw === "number") return raw;
  const cleaned = raw.toLowerCase().replace(/,/g, "").trim();
  if (cleaned.endsWith("k")) {
    return Number.parseFloat(cleaned.replace("k", "")) * 1000;
  }
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n)) throw new Error(`Invalid price: ${raw}`);
  return n;
}

export function buildProductPrices(originalMajor: number, saleMajor: number) {
  const sale = saleMajor > 0 && saleMajor < originalMajor ? saleMajor : originalMajor;
  const discount =
    originalMajor > 0 && sale < originalMajor
      ? Math.round((1 - sale / originalMajor) * 100)
      : 0;

  return {
    original_price: originalMajor,
    sale_price: sale,
    discount_percentage: discount,
    original_price_minor: Math.round(originalMajor * 100),
    sale_price_minor: Math.round(sale * 100),
  };
}

export function pickImages(files: string[], limit = IMAGES_PER_PRODUCT) {
  const score = (file: string) => {
    const lower = file.toLowerCase();
    if (lower.includes("ai ") || lower.includes("ai gen") || lower.includes("generated")) return 3;
    if (lower.includes("chatgpt") || lower.includes("firefly") || lower.includes("gemini")) return 4;
    if (lower.endsWith(".jpeg") || lower.endsWith(".jpg")) return 0;
    if (lower.endsWith(".png")) return 1;
    return 2;
  };

  return [...files]
    .filter((file) => /\.(jpe?g|png|webp)$/i.test(file))
    .sort((a, b) => score(a) - score(b))
    .slice(0, limit);
}

export function pickCollectionFolderImages(roots: string[], limit = 2) {
  const files: string[] = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const file of fs.readdirSync(root)) {
      if (/\.(jpe?g|png|webp)$/i.test(file)) {
        files.push(path.join(root, file));
      }
    }
  }

  const score = (file: string) => {
    const lower = path.basename(file).toLowerCase();
    if (lower.includes("ai ") || lower.includes("ai gen") || lower.includes("generated")) return 3;
    if (lower.includes("chatgpt") || lower.includes("firefly") || lower.includes("gemini")) return 4;
    if (lower.endsWith(".jpeg") || lower.endsWith(".jpg")) return 0;
    if (lower.endsWith(".png")) return 1;
    return 2;
  };

  return [...new Set(files)].sort((a, b) => score(a) - score(b)).slice(0, limit);
}

export function findDesignImages(
  roots: string[],
  design: string,
  color?: string,
  limit = IMAGES_PER_PRODUCT
) {
  const designDigits = design.replace(/[^\dA-Za-z]/g, "").toLowerCase();
  const colorTokens = (color ?? "")
    .toLowerCase()
    .split(/[\s/,&]+/)
    .filter((token) => token.length > 2);

  const matches: string[] = [];

  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const file of fs.readdirSync(root)) {
      const lower = file.toLowerCase();
      const normalized = lower.replace(/[^\dA-Za-z]/g, "");
      const designMatch =
        designDigits.length > 0 &&
        (normalized.includes(`design${designDigits}`) || normalized.includes(designDigits));
      const colorMatch = colorTokens.some((token) => lower.includes(token));
      if (designMatch || colorMatch) {
        matches.push(path.join(root, file));
      }
    }
  }

  const score = (file: string) => {
    const lower = path.basename(file).toLowerCase();
    if (lower.includes("ai ") || lower.includes("ai gen") || lower.includes("generated")) return 3;
    if (lower.includes("chatgpt") || lower.includes("firefly") || lower.includes("gemini")) return 4;
    if (lower.endsWith(".jpeg") || lower.endsWith(".jpg")) return 0;
    if (lower.endsWith(".png")) return 1;
    return 2;
  };

  return [...new Set(matches)].sort((a, b) => score(a) - score(b)).slice(0, limit);
}

export async function uploadLocalImage(localPath: string) {
  const buffer = fs.readFileSync(localPath);
  const filename = sanitizeCloudinarySegment(
    path.basename(localPath, path.extname(localPath))
  );
  const publicId = `${CLOUDINARY_ROOT}/seed/${filename || "image"}-${Date.now()}`;

  const uploaded = await uploadImageBuffer(buffer, {
    publicId,
    mimeType: contentType(localPath),
    overwrite: true,
  });

  return {
    url: uploaded.secureUrl,
    publicId: uploaded.publicId,
  };
}

export async function upsertCategory(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  input: { name: string; slug: string; description: string }
) {
  const { data, error } = await supabase
    .from("categories")
    .upsert(
      { name: input.name, slug: input.slug, description: input.description, is_active: true },
      { onConflict: "slug" }
    )
    .select("id, slug, name")
    .single();

  if (error || !data) throw new Error(`Category upsert failed: ${error?.message}`);
  return data;
}

export async function clearProductChildren(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  productId: string
) {
  const { data: variants } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);

  const variantIds = variants?.map((v) => v.id) ?? [];
  if (variantIds.length > 0) {
    await supabase.from("product_variant_inventory").delete().in("variant_id", variantIds);
    await supabase.from("product_images").delete().in("variant_id", variantIds);
    await supabase.from("product_variants").delete().eq("product_id", productId);
  }

  await supabase.from("product_images").delete().eq("product_id", productId).is("variant_id", null);
  await supabase.from("product_specifications").delete().eq("product_id", productId);
  await supabase.from("inventory").delete().eq("product_id", productId);
}

export async function upsertDefaultVariant(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  productId: string,
  input: {
    sku: string;
    name: string;
    originalPrice: number;
    salePrice: number;
    discountPercentage: number;
  }
) {
  const prices = buildProductPrices(input.originalPrice, input.salePrice);

  const { data: variant, error } = await supabase
    .from("product_variants")
    .upsert(
      {
        product_id: productId,
        sku: input.sku,
        name: input.name,
        original_price: prices.original_price,
        sale_price: prices.sale_price,
        discount_percentage: input.discountPercentage,
        price_minor: prices.original_price_minor,
        sale_price_minor: prices.sale_price_minor,
        is_default: true,
        is_active: true,
        sort_order: 0,
      },
      { onConflict: "sku" }
    )
    .select("id")
    .single();

  if (error || !variant) {
    throw new Error(`Default variant upsert failed (${input.sku}): ${error?.message}`);
  }

  await supabase.from("product_variant_inventory").delete().eq("variant_id", variant.id);
  return variant.id;
}

export async function insertProductImages(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  productId: string,
  images: Array<{ url: string; publicId: string; alt: string }>,
  variantId?: string | null
) {
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const { error } = await supabase.from("product_images").insert({
      product_id: productId,
      variant_id: variantId ?? null,
      image_url: image.url,
      cloudinary_public_id: image.publicId,
      alt_text: image.alt,
      sort_order: i,
      is_primary: i === 0,
    });
    if (error) throw new Error(`Image insert failed: ${error.message}`);
  }
}

export async function uploadAndInsertProductImages(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  productId: string,
  localPaths: string[],
  alt: string,
  variantId?: string | null
) {
  const uploaded: Array<{ url: string; publicId: string; alt: string }> = [];

  for (const localPath of localPaths) {
    const result = await uploadLocalImage(localPath);
    uploaded.push({
      url: result.url,
      publicId: result.publicId,
      alt,
    });
  }

  await insertProductImages(supabase, productId, uploaded, variantId);
  return uploaded;
}
