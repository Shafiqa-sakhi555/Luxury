import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Clock, ArrowLeft, Navigation, ExternalLink } from "lucide-react";
import { getStorefrontBranchBySlug } from "@/server/stores/queries";
import { toStoreLocatorBranch } from "@/lib/store-locator";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const branch = await getStorefrontBranchBySlug(slug).catch(() => null);
  if (!branch) return { title: "Showroom" };

  return {
    title: `${branch.name} Showroom`,
    description: branch.description ?? `Visit Jalal's Home Solution in ${branch.city}.`,
  };
}

export default async function StoreDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const branch = await getStorefrontBranchBySlug(slug).catch(() => null);
  if (!branch) notFound();

  const locator = toStoreLocatorBranch(branch);

  return (
    <div>
      <section className="relative min-h-[360px] overflow-hidden sm:min-h-[480px]">
        <Image
          src={branch.imageUrl}
          alt={branch.name}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-navy/20" />
        <div className="relative mx-auto flex min-h-[360px] max-w-7xl flex-col justify-end px-4 pb-10 pt-28 sm:min-h-[480px] sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">{branch.region}</p>
          <h1 className="mt-2 font-display text-4xl text-white sm:text-5xl">{branch.name}</h1>
          <p className="mt-3 max-w-2xl text-white/80">
            {branch.city}
            {branch.productCount > 0 ? ` · ${branch.productCount}+ products` : ""}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/stores" className="inline-flex items-center gap-2 text-sm text-navy hover:underline">
          <ArrowLeft className="h-4 w-4" />
          All showrooms
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl text-navy">About this branch</h2>
            <p className="mt-4 text-base leading-relaxed text-ink">
              {branch.description ||
                `Visit our ${branch.name} showroom in ${branch.region} for carpets, rugs, furniture, and home décor.`}
            </p>

            <aside className="mt-8 rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">Location</h2>
              <ul className="mt-4 space-y-4 text-sm">
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red" />
                  <span>{branch.address}</span>
                </li>
                {branch.phone && branch.phone !== "—" ? (
                  <li className="flex gap-3">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-red" />
                    <a href={`tel:${branch.phone.replace(/\s/g, "")}`} className="hover:underline">
                      {branch.phone}
                    </a>
                  </li>
                ) : null}
                {branch.hours ? (
                  <li className="flex gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-red" />
                    <span>{branch.hours}</span>
                  </li>
                ) : null}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="sm">
                  <a href={locator.directionsUrl} target="_blank" rel="noopener noreferrer">
                    <Navigation className="mr-2 h-4 w-4" />
                    Get directions
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href={locator.placeUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on Google Maps
                  </a>
                </Button>
              </div>
            </aside>
          </div>

          <div className="relative min-h-[360px] overflow-hidden rounded-2xl bg-mist shadow-sm ring-1 ring-navy/8 sm:min-h-[480px]">
            <iframe
              title={`Map of ${branch.name}`}
              src={locator.embedUrl}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  );
}
