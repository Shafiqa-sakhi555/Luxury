"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Clock,
  Navigation,
  ExternalLink,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  branches,
  branchBrands,
  branchesByRegion,
  googleMapsDirectionsUrl,
  googleMapsEmbedUrl,
  googleMapsPlaceUrl,
  type Branch,
} from "@/lib/branches";

function BranchCard({
  branch,
  isSelected,
  onSelect,
}: {
  branch: Branch;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const brandStyle = branchBrands[branch.brand];

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`w-full rounded-2xl border p-5 text-left transition-all sm:p-6 ${
        isSelected
          ? "border-violet/40 bg-white shadow-lg ring-2 ring-violet/20"
          : "border-navy/5 bg-white shadow-sm hover:border-violet/20 hover:shadow-md"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white ${brandStyle.color}`}
          >
            {brandStyle.label}
          </span>
          {branch.isFlagship && (
            <span className="rounded-full bg-cyan/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan">
              Flagship
            </span>
          )}
        </div>
        {branch.googleRating && (
          <div className="flex items-center gap-1 text-xs text-muted">
            <Star className="h-3.5 w-3.5 fill-cyan text-cyan" />
            {branch.googleRating}
            {branch.googleReviewCount && (
              <span className="text-muted/70">({branch.googleReviewCount})</span>
            )}
          </div>
        )}
      </div>

      <h3 className="mt-3 font-display text-xl text-navy">{branch.name}</h3>
      <p className="mt-0.5 text-xs text-muted">
        {branch.city} · {branch.region}
      </p>

      <div className="mt-4 space-y-2.5 text-sm text-muted">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red" />
          <span>{branch.address}</span>
        </div>
        <div className="flex items-start gap-2">
          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-red" />
          <div className="space-y-1">
            {branch.contacts.map((contact) => (
              <div key={contact.label} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  {contact.label}:
                </span>
                <a
                  href={`tel:${contact.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-navy hover:text-red"
                >
                  {contact.phoneDisplay}
                </a>
              </div>
            ))}
          </div>
        </div>
        {branch.hours && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-red" />
            <span>{branch.hours}</span>
          </div>
        )}
      </div>

      {branch.note && (
        <p className="mt-3 text-xs italic text-muted/80">{branch.note}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <a
            href={googleMapsDirectionsUrl(branch)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <Navigation className="h-3.5 w-3.5" />
            Directions
          </a>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <a
            href={googleMapsPlaceUrl(branch)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Google Maps
          </a>
        </Button>
      </div>
    </motion.button>
  );
}

export function BranchesSection() {
  const grouped = branchesByRegion();
  const [selectedId, setSelectedId] = useState(branches[0].id);
  const selected = branches.find((b) => b.id === selectedId) ?? branches[0];

  return (
    <section id="branches" className="bg-mist py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-red sm:text-xs">
            Visit Us
          </span>
          <h2 className="mt-3 font-display text-3xl font-light text-navy sm:text-4xl md:text-5xl">
            Our Branches Across Gilgit-Baltistan
          </h2>
          <p className="mt-4 text-sm text-muted sm:text-base">
            Jalal&apos;s Home Solution, Pak Turk Carpets, and Jalal Carpets — five
            showrooms across GB. Select a branch to view it on the map.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-8 max-h-[720px] overflow-y-auto pr-1 hide-scrollbar">
            {Object.entries(grouped).map(([region, regionBranches]) => (
              <div key={region}>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-violet">
                  {region}
                </h3>
                <div className="space-y-4">
                  {regionBranches.map((branch) => (
                    <BranchCard
                      key={branch.id}
                      branch={branch}
                      isSelected={selectedId === branch.id}
                      onSelect={() => setSelectedId(branch.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-navy/10">
              <div className="border-b border-navy/5 bg-white px-4 py-3 sm:px-5">
                <p className="font-medium text-navy">{selected.name}</p>
                <p className="text-xs text-muted">{selected.brandLabel} · {selected.city}</p>
              </div>
              <div className="relative aspect-[4/3] w-full bg-slate/30 sm:aspect-square lg:aspect-[4/3]">
                <iframe
                  key={selected.id}
                  title={`Map — ${selected.name}`}
                  src={googleMapsEmbedUrl(selected)}
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <div className="flex gap-2 border-t border-navy/5 bg-white p-3 sm:p-4">
                <Button variant="default" size="sm" className="flex-1" asChild>
                  <a href={googleMapsDirectionsUrl(selected)} target="_blank" rel="noopener noreferrer">
                    <Navigation className="h-4 w-4" />
                    Get Directions
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={googleMapsPlaceUrl(selected)} target="_blank" rel="noopener noreferrer">
                    Open in Maps
                  </a>
                </Button>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted italic">
              Map pins are approximate. Confirm exact location on Google Maps before visiting.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
