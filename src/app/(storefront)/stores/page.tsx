import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Phone, Clock, Navigation, ExternalLink } from "lucide-react";
import {
  branches,
  branchesByRegion,
  branchBrands,
  googleMapsDirectionsUrl,
  googleMapsPlaceUrl,
  googleMapsEmbedUrl,
  TOTAL_BRANCHES,
  type Branch,
} from "@/lib/branches";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Store Locator",
  description: `${TOTAL_BRANCHES} showrooms across Gilgit-Baltistan — carpets, rugs, furniture, flooring and home décor.`,
};

function BranchCard({ branch }: { branch: Branch }) {
  const brand = branchBrands[branch.brand];

  return (
    <article
      id={branch.id}
      className="overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-navy/8"
    >
      <div className="relative aspect-[16/9] bg-mist">
        <iframe
          title={`Map of ${branch.name}`}
          src={googleMapsEmbedUrl(branch)}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white ${brand.color}`}
            >
              {branch.brandLabel}
            </span>
            <h2 className="mt-2 font-display text-2xl text-navy">{branch.name}</h2>
            <p className="text-sm text-muted">
              {branch.city} · {branch.region}
            </p>
          </div>
          {branch.isFlagship && (
            <span className="rounded-full bg-red/10 px-3 py-1 text-xs font-medium text-red">
              Flagship
            </span>
          )}
        </div>

        {branch.note && (
          <p className="mt-3 text-sm italic text-muted">{branch.note}</p>
        )}

        <ul className="mt-5 space-y-3 text-sm">
          <li className="flex gap-3 text-muted">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red" />
            <span>{branch.address}</span>
          </li>
          {branch.hours && (
            <li className="flex gap-3 text-muted">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-red" />
              <span>{branch.hours}</span>
            </li>
          )}
        </ul>

        <div className="mt-5 rounded-xl bg-brand-50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy">
            Contact
          </p>
          <ul className="space-y-2">
            {branch.contacts.map((contact) => (
              <li key={contact.label} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted">{contact.label}</span>
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-1.5 font-medium text-navy hover:text-red"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {contact.phoneDisplay}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild size="sm">
            <a href={googleMapsDirectionsUrl(branch)} target="_blank" rel="noopener noreferrer">
              <Navigation className="mr-2 h-4 w-4" />
              Get directions
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={googleMapsPlaceUrl(branch)} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Google Maps
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function StoresPage() {
  const byRegion = branchesByRegion();

  return (
    <div>
      <section className="border-b border-navy/10 bg-white pt-28 pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red">Visit us</p>
          <h1 className="mt-2 font-display text-4xl text-navy sm:text-5xl">
            {TOTAL_BRANCHES} Showrooms Across Gilgit-Baltistan
          </h1>
          <p className="mt-4 max-w-2xl text-muted">
            Explore carpets, rugs, furniture, flooring and home décor in person. Each branch is
            staffed by specialists who can help with sizing, custom orders and installation.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {branches.map((branch) => (
              <a
                key={branch.id}
                href={`#${branch.id}`}
                className="rounded-full bg-brand-50 px-4 py-2 text-sm text-navy ring-1 ring-navy/10 transition hover:bg-navy hover:text-white"
              >
                {branch.city}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 lg:px-8">
        {Object.entries(byRegion).map(([region, regionBranches]) => (
          <section key={region}>
            <h2 className="font-display text-2xl text-navy">{region}</h2>
            <div className="mt-6 grid gap-8 lg:grid-cols-2">
              {regionBranches.map((branch) => (
                <BranchCard key={branch.id} branch={branch} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="border-t border-navy/10 bg-brand-50 py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl text-navy">Need help choosing?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Book a free consultation or send us a message — we respond within one business day.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Button asChild>
              <Link href="/contact">Contact us</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/shop">Browse online</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
