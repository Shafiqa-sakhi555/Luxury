import { getPublicSupabaseAnonKey } from "@/lib/supabase/public-keys";

export function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not set. Add it to .env (see .env.example)."
    );
  }
  return url;
}

export function getSupabaseAnonKey() {
  const key = getPublicSupabaseAnonKey();
  if (!key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) is not set. Add it to .env (see .env.example)."
    );
  }
  return key;
}

export function getSupabaseServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Required for server-side admin operations — never expose to the browser."
    );
  }
  return key;
}

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && getPublicSupabaseAnonKey());
}
