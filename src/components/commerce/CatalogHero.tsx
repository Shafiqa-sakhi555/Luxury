import Image from "next/image";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/commerce/Breadcrumbs";

export function CatalogHero({
  eyebrow,
  title,
  description,
  countLabel,
  breadcrumbs,
  heroImageSrc,
}: {
  eyebrow: string;
  title: string;
  description: string;
  countLabel?: string;
  breadcrumbs?: BreadcrumbItem[];
  heroImageSrc?: string | null;
}) {
  return (
    <section className="relative overflow-hidden section-brand-light pt-28 pb-12 sm:pb-16">
      {heroImageSrc ? (
        <div className="absolute inset-0">
          <Image
            src={heroImageSrc}
            alt=""
            fill
            className="object-cover opacity-20"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-50/80 via-brand-50/95 to-brand-50" />
        </div>
      ) : (
        <>
          <div className="blob-red left-0 top-10 h-64 w-64 opacity-40" />
          <div className="blob-blue right-[-4rem] bottom-0 h-72 w-72 opacity-30" />
        </>
      )}

      <PageContainer className="relative">
        {breadcrumbs ? <Breadcrumbs className="mb-6" items={breadcrumbs} /> : null}
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
          className="mb-0"
        />
        {countLabel ? (
          <p className="mt-5 inline-flex rounded-full border border-navy/10 bg-white/85 px-3.5 py-1.5 text-xs font-medium text-navy/70 shadow-sm">
            {countLabel}
          </p>
        ) : null}
      </PageContainer>
    </section>
  );
}
