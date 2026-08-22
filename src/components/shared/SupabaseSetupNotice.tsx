import Link from "next/link";

export function SupabaseSetupNotice({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 ${className}`}
    >
      <p className="font-medium">Database connection is not configured</p>
      <p className="mt-1 text-amber-900/90">
        Create <code className="rounded bg-white/70 px-1">.env.local</code> in the project root with your
        Supabase keys from Dashboard → Project Settings → API, then restart{" "}
        <code className="rounded bg-white/70 px-1">npm run dev</code>.
      </p>
      <p className="mt-2 text-xs text-amber-900/80">
        Required: <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>,{" "}
        <code>SUPABASE_SERVICE_ROLE_KEY</code>
      </p>
      <p className="mt-2">
        <Link href="/admin/login" className="font-medium text-navy underline">
          Admin login
        </Link>{" "}
        and the shop catalog both need these variables.
      </p>
    </div>
  );
}
