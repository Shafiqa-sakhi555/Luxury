"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseSetupMessage } from "@/lib/supabase/public-env";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

/** Returns null when env vars are missing instead of crashing the page. */
export function tryCreateSupabaseBrowserClient() {
  return getSupabaseBrowserClient();
}

/** Throws when env vars are missing — use only after checking configuration. */
export function createSupabaseBrowserClient() {
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error(getSupabaseSetupMessage());
  }
  return client;
}

export { createBrowserClient };
