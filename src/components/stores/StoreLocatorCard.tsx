import Image from "next/image";
import { MapPin, Phone, Clock, Navigation, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StoreLocatorBranch } from "@/lib/store-locator";

export function StoreLocatorCard({ branch }: { branch: StoreLocatorBranch }) {
  return (
    <article
      id={branch.id}
      className="overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-navy/8"
    >
      <div className="grid lg:grid-cols-2">
        <div className="flex min-w-0 flex-col">
          <div className="relative aspect-[16/10] bg-mist lg:aspect-auto lg:min-h-[280px]">
            <Image
              src={branch.imageUrl}
              alt={branch.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          <div className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white ${branch.brandColor}`}
                >
                  {branch.brandLabel}
                </span>
                <h2 className="mt-2 font-display text-2xl text-navy">{branch.name}</h2>
                <p className="text-sm text-muted">
                  {branch.city} · {branch.region}
                </p>
              </div>
              {branch.isFlagship ? (
                <span className="rounded-full bg-red/10 px-3 py-1 text-xs font-medium text-red">
                  Flagship
                </span>
              ) : null}
            </div>

            {branch.description ? (
              <p className="mt-3 text-sm italic text-muted">{branch.description}</p>
            ) : null}

            <ul className="mt-5 space-y-3 text-sm">
              <li className="flex gap-3 text-muted">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red" />
                <span>{branch.address}</span>
              </li>
              {branch.hours ? (
                <li className="flex gap-3 text-muted">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-red" />
                  <span>{branch.hours}</span>
                </li>
              ) : null}
            </ul>

            {branch.contacts.length > 0 ? (
              <div className="mt-5 rounded-xl bg-brand-50 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy">
                  Contact
                </p>
                <ul className="space-y-2">
                  {branch.contacts.map((contact) => (
                    <li
                      key={`${contact.label}-${contact.phone}`}
                      className="flex items-center justify-between gap-4 text-sm"
                    >
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
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild size="sm">
                <a href={branch.directionsUrl} target="_blank" rel="noopener noreferrer">
                  <Navigation className="mr-2 h-4 w-4" />
                  Get directions
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={branch.placeUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on Google Maps
                </a>
              </Button>
            </div>
          </div>
        </div>

        <div className="relative min-h-[280px] bg-mist lg:min-h-full">
          <iframe
            title={`Map of ${branch.name}`}
            src={branch.embedUrl}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </article>
  );
}
