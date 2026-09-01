import {
  branchBrands,
  findStaticBranch,
  googleMapsDirectionsFromQuery,
  googleMapsEmbedFromQuery,
  googleMapsPlaceFromQuery,
  type BranchContact,
} from "@/lib/branches";
import type { StorefrontBranch } from "@/types/admin-store";

export type StoreLocatorBranch = {
  id: string;
  slug: string;
  name: string;
  city: string;
  region: string;
  address: string;
  description: string | null;
  hours: string | null;
  imageUrl: string;
  contacts: BranchContact[];
  embedUrl: string;
  directionsUrl: string;
  placeUrl: string;
  brandLabel: string;
  brandColor: string;
  isFlagship: boolean;
};

function toTel(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("92")) return `+${digits}`;
  if (digits.startsWith("0")) return `+92${digits.slice(1)}`;
  return digits;
}

function toDisplay(phone: string) {
  return phone.replace(/^\+92/, "0").replace(/^92/, "0");
}

export function toStoreLocatorBranch(store: StorefrontBranch): StoreLocatorBranch {
  const staticBranch = findStaticBranch(store.slug, store.city);
  const brand = staticBranch ? branchBrands[staticBranch.brand] : branchBrands["jalals-home"];
  const mapQuery = store.address || staticBranch?.googleMapsQuery || `${store.name}, ${store.city}`;

  const contacts: BranchContact[] =
    staticBranch?.contacts && staticBranch.contacts.length > 0
      ? staticBranch.contacts
      : store.phone && store.phone !== "—"
        ? [
            {
              label: "Branch Office",
              phone: toTel(store.phone),
              phoneDisplay: toDisplay(store.phone),
            },
          ]
        : [];

  return {
    id: store.slug,
    slug: store.slug,
    name: store.name,
    city: store.city,
    region: store.region,
    address: store.address,
    description: store.description || staticBranch?.note || null,
    hours: store.hours || staticBranch?.hours || null,
    imageUrl: store.imageUrl,
    contacts,
    embedUrl: googleMapsEmbedFromQuery(mapQuery, staticBranch?.lat, staticBranch?.lng),
    directionsUrl: googleMapsDirectionsFromQuery(mapQuery, staticBranch?.lat, staticBranch?.lng),
    placeUrl: googleMapsPlaceFromQuery(staticBranch?.googleMapsQuery || mapQuery),
    brandLabel: staticBranch?.brandLabel ?? brand.label,
    brandColor: brand.color,
    isFlagship: Boolean(staticBranch?.isFlagship),
  };
}

export function groupLocatorBranches(branches: StoreLocatorBranch[]) {
  return branches.reduce<Record<string, StoreLocatorBranch[]>>((acc, branch) => {
    const region = branch.region || branch.city;
    if (!acc[region]) acc[region] = [];
    acc[region].push(branch);
    return acc;
  }, {});
}
