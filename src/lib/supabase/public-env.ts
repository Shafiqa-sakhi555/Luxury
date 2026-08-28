import { getPublicSupabaseAnonKey } from "@/lib/supabase/public-keys";

/** Client-safe check — does not throw when env vars are missing. */
export function isSupabaseBrowserConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && getPublicSupabaseAnonKey());
}

export function getSupabaseSetupMessage() {
  return "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) to .env, then restart npm run dev.";
}
