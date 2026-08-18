/**
 * Export static product knowledge from Supabase for RAG indexing.
 * Excludes: prices, discounts, stock quantities, branch availability.
 *
 * Usage: npm run assistant:export-products
 */
import "dotenv/config";
import { config } from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { createSupabaseAdminClient } from "../../src/lib/supabase/admin";
import { SUPABASE_CATALOG_SLUGS } from "../../src/lib/supabase/catalog-categories";
import type { ProductExportManifest, ProductKnowledgeRecord } from "../../src/server/assistant/knowledge/types";

config({ path: path.join(process.cwd(), ".env.local"), override: true });

const OUT_DIR = path.join(process.cwd(), "jalal-ai-knowledge/products/export");
const OUT_FILE = path.join(OUT_DIR, "products.json");

const ROOM_MAP: Record<string, string[]> = {
  curtains: ["living_room", "bedroom", "dining_room", "office"],
  carpets: ["living_room", "bedroom", "office", "dining_room"],
  "prayer-mats": ["prayer_space", "bedroom"],
};

const STYLE_HINTS: Record<string, string[]> = {
  curtains: ["modern", "minimal", "cozy"],
  carpets: ["modern", "traditional", "luxury", "rustic"],
  "prayer-mats": ["traditional", "luxury"],
};

function buildKeywords(name: string, sku: string | null, fabric: string | null, design: string | null) {
  const parts = [name, sku, fabric, design].filter(Boolean) as string[];
  return [...new Set(parts.join(" ").toLowerCase().split(/\s+/).filter((w) => w.length > 2))];
}

async function main() {
  const supabase = createSupabaseAdminClient();

  const { data: products, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      sku,
      short_description,
      description,
      size,
      fabric,
      design,
      selling_unit,
      included_items,
      created_at,
      updated_at,
      status,
      categories ( id, name, slug ),
      product_images ( image_url, is_primary, sort_order ),
      product_specifications ( spec_key, spec_value, sort_order ),
      product_variants (
        id,
        sku,
        name,
        color,
        design,
        size,
        quality,
        is_active
      )
    `
    )
    .eq("status", "ACTIVE")
    .order("name");

  if (error) {
    console.error("Failed to fetch products:", error.message);
    process.exit(1);
  }

  const records: ProductKnowledgeRecord[] = (products ?? []).map((p) => {
    const category = p.categories as { id: string; name: string; slug: string } | null;
    const categorySlug = category?.slug ?? "unknown";
    const images = [...(p.product_images ?? [])]
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((img) => img.image_url);

    const specs = [...(p.product_specifications ?? [])]
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((s) => ({ key: s.spec_key, value: s.spec_value }));

    const variants = (p.product_variants ?? [])
      .filter((v) => v.is_active !== false)
      .map((v) => ({
        variant_id: v.id,
        sku: v.sku,
        name: v.name,
        color: v.color,
        design: v.design,
        size: v.size,
        quality: v.quality,
      }));

    const indoorOutdoor =
      categorySlug === "carpets" && /grass|turf|artificial/i.test(p.name)
        ? ("outdoor" as const)
        : ("indoor" as const);

    return {
      product_id: p.id,
      sku: p.sku,
      slug: p.slug,
      name: p.name,
      category: category?.name ?? categorySlug,
      category_slug: categorySlug,
      short_description: p.short_description,
      description: p.description,
      material: p.fabric,
      fabric: p.fabric,
      design: p.design,
      size: p.size,
      selling_unit: p.selling_unit,
      included_items: p.included_items,
      styles: STYLE_HINTS[categorySlug] ?? [],
      rooms: ROOM_MAP[categorySlug] ?? [],
      indoor_outdoor: indoorOutdoor,
      tags: [categorySlug, p.design, p.fabric].filter(Boolean) as string[],
      search_keywords: buildKeywords(p.name, p.sku, p.fabric, p.design),
      images,
      variants,
      specifications: specs,
      related_products: [],
      complementary_products: [],
      alternative_products: [],
      created_at: p.created_at,
      updated_at: p.updated_at,
      pricing_source: "live_database" as const,
      is_canonical_category: (SUPABASE_CATALOG_SLUGS as readonly string[]).includes(categorySlug),
    };
  });

  const canonicalProducts = records.filter((r) => r.is_canonical_category);
  const manifest: ProductExportManifest = {
    verified: true,
    source: "Supabase products table (ACTIVE only)",
    exported_at: new Date().toISOString(),
    product_count: records.length,
    canonical_product_count: canonicalProducts.length,
    canonical_categories: [...SUPABASE_CATALOG_SLUGS],
    categories: [...new Set(records.map((r) => r.category_slug))],
    products: records,
  };

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(manifest, null, 2), "utf8");

  console.log(`Exported ${records.length} products to ${OUT_FILE}`);
  console.log(`Categories: ${manifest.categories.join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
