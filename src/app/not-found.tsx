import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-50 px-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-red">404</p>
      <h1 className="mt-2 font-display text-4xl text-navy">Page not found</h1>
      <p className="mt-4 max-w-md text-muted">The page you are looking for does not exist or has moved.</p>
      <Link href="/" className="mt-8 rounded-full bg-navy px-6 py-3 text-sm text-white hover:bg-navy/90">
        Return home
      </Link>
    </div>
  );
}
