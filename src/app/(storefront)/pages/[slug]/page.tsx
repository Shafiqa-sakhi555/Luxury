import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/server/db";
import { Footer } from "@/components/layout/Footer";

export default async function ContentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await db.contentPage.findFirst({
    where: { slug, status: "ACTIVE" },
  }).catch(() => null);
  if (!page) notFound();

  return (
    <div>
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-28 sm:px-6">
        <nav className="mb-6 text-sm text-muted">
          <Link href="/" className="hover:text-navy">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-navy">{page.title}</span>
        </nav>
        <h1 className="font-display text-4xl text-navy">{page.title}</h1>
        <div className="prose prose-navy mt-8 max-w-none whitespace-pre-line text-muted">{page.body}</div>
      </div>
      <Footer />
    </div>
  );
}
