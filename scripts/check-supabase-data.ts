import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local", override: true });
config({ path: ".env", override: true });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing Supabase env vars");
    process.exit(1);
  }

  const sb = createClient(url, key);

  const { data: categories, error: catError } = await sb
    .from("categories")
    .select("name, slug, is_active, parent_id")
    .order("sort_order");

  if (catError) {
    console.error("Categories error:", catError.message);
    process.exit(1);
  }

  const { count: totalProducts } = await sb
    .from("products")
    .select("id", { count: "exact", head: true });

  const { count: activeProducts } = await sb
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("status", "ACTIVE");

  const { count: draftProducts } = await sb
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("status", "DRAFT");

  console.log(`Categories: ${categories?.length ?? 0}`);
  for (const cat of categories ?? []) {
    console.log(`  - ${cat.slug} (${cat.is_active ? "active" : "archived"})`);
  }
  console.log(`Products: ${totalProducts ?? 0} total, ${activeProducts ?? 0} ACTIVE, ${draftProducts ?? 0} DRAFT`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
