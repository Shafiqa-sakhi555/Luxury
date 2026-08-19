import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ContentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  // Content pages are currently static or not fully migrated to Supabase
  // We'll just return a 404 for now, or you can implement a Supabase table for it.
  notFound();

  return (
    <div>
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-28 sm:px-6">
        <nav className="mb-6 text-sm text-muted">
          <Link href="/" className="hover:text-navy">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-navy">Page</span>
        </nav>
        <h1 className="font-display text-4xl text-navy">Page</h1>
        <div className="prose prose-navy mt-8 max-w-none whitespace-pre-line text-muted">Content</div>
      </div>
    </div>
  );
}
