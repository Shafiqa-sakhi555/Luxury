"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseAnonKey } from "@/lib/supabase/public-keys";
import { isSupabaseBrowserConfigured } from "@/lib/supabase/public-env";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseBrowserConfigured()) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = getPublicSupabaseAnonKey()!;
  if (!cachedClient) {
    cachedClient = createBrowserClient(url, key);
  }
  return cachedClient;
}
