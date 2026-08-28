/** Browser-safe Supabase key — supports legacy anon JWT or newer publishable key. */
export function getPublicSupabaseAnonKey(): string | undefined {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (anon) return anon;

  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return publishable || undefined;
}
