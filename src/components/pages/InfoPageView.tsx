import Link from "next/link";
import type { Metadata } from "next";
import type { InfoPage } from "@/lib/infoPages";

export function InfoPageView({ page }: { page: InfoPage }) {
  return (
    <div>
      <section className="border-b border-navy/10 bg-white pt-28 pb-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-6 text-sm text-muted">
            <Link href="/" className="hover:text-navy">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-navy">{page.title}</span>
          </nav>
          <h1 className="font-display text-4xl text-navy sm:text-5xl">{page.title}</h1>
          <p className="mt-4 text-muted">{page.subtitle}</p>
          {page.placeholder && (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Placeholder content — final legal copy will be supplied by the client before launch.
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-10">
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-2xl text-navy">{section.heading}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export function infoPageMetadata(page: InfoPage): Metadata {
  return {
    title: page.title,
    description: page.subtitle,
  };
}
