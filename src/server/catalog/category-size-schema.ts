import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

let schemaCache: { ready: boolean; checkedAt: number } | null = null;
const CACHE_MS = 60_000;

export function isMissingSchemaError(message: string | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("does not exist") ||
    lower.includes("could not find") ||
    lower.includes("category_sizes") ||
    lower.includes("sizes_enabled")
  );
}

/** Returns true when migrations 015 + 016 have been applied. */
export async function isCategorySizesSchemaReady(force = false): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const now = Date.now();
  if (!force && schemaCache && now - schemaCache.checkedAt < CACHE_MS) {
    return schemaCache.ready;
  }

  const supabase = createSupabaseAdminClient();

  const [{ error: sizeTableError }, { error: columnError }] = await Promise.all([
    supabase.from("category_sizes").select("id").limit(1),
    supabase.from("categories").select("sizes_enabled").limit(1),
  ]);

  const ready = !sizeTableError && !columnError;

  schemaCache = { ready, checkedAt: now };
  return ready;
}

export const CATEGORY_SIZES_MIGRATION_HINT =
  "Category sizes need a database update. In Supabase Dashboard → SQL Editor, run the SQL from supabase/migrations/015_category_sizes_and_variant_extensions.sql and 016_category_sizes_enabled.sql, or set SUPABASE_DB_URL and run: npm run supabase:migrate";
