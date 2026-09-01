export type BranchBrand = "jalals-home" | "pak-turk" | "jalal-carpets";

export type BranchContact = {
  label: string;
  phone: string;
  phoneDisplay: string;
};

export type Branch = {
  id: string;
  brand: BranchBrand;
  brandLabel: string;
  name: string;
  city: string;
  region: string;
  address: string;
  /** Primary line — usually branch office */
  phone: string;
  phoneDisplay: string;
  contacts: BranchContact[];
  hours?: string;
  lat: number;
  lng: number;
  googleMapsQuery: string;
  googleRating?: number;
  googleReviewCount?: number;
  isFlagship?: boolean;
  opened?: string;
  note?: string;
};

export const branchBrands: Record<
  BranchBrand,
  { label: string; color: string }
> = {
  "jalals-home": { label: "Jalal's Home Solution", color: "bg-red" },
  "pak-turk": { label: "Pak Turk Carpets", color: "bg-violet" },
  "jalal-carpets": { label: "Jalal Carpets", color: "bg-blue" },
};

/** Official operations branches — 5 locations across Gilgit-Baltistan */
export const branches: Branch[] = [
  {
    id: "gilgit-branch",
    brand: "jalals-home",
    brandLabel: "Jalal's Home Solution",
    name: "Gilgit Branch",
    city: "Gilgit",
    region: "Gilgit District",
    address:
      "Shahr-e-Quaid-e-Azam, near Bank Alfalah, near Pizza King, Tehsil Gilgit, 15100, Gilgit-Baltistan, Pakistan",
    phone: "+923554948703",
    phoneDisplay: "0355 4948703",
    contacts: [
      { label: "Branch Office", phone: "+923554948703", phoneDisplay: "0355 4948703" },
      { label: "HR", phone: "+923554948708", phoneDisplay: "0355 4948708" },
      { label: "Management", phone: "+923135205272", phoneDisplay: "0313 5205272" },
    ],
    hours: "Open daily — call for exact hours",
    lat: 35.9194,
    lng: 74.3178,
    googleMapsQuery:
      "Jalal's Home Solution, Shahr-e-Quaid-e-Azam, near Bank Alfalah, Gilgit",
    isFlagship: true,
  },
  {
    id: "hunza-branch",
    brand: "jalals-home",
    brandLabel: "Jalal's Home Solution",
    name: "Hunza Branch",
    city: "Hunza",
    region: "Hunza District",
    address: "Hospital Road, Aliabad, Hunza",
    phone: "+923554323944",
    phoneDisplay: "0355 4323944",
    contacts: [
      { label: "Branch Office", phone: "+923554323944", phoneDisplay: "0355 4323944" },
      { label: "HR", phone: "+923554948708", phoneDisplay: "0355 4948708" },
      { label: "Management", phone: "+923135205272", phoneDisplay: "0313 5205272" },
    ],
    hours: "Open daily — call for exact hours",
    lat: 36.3075,
    lng: 74.6675,
    googleMapsQuery: "Jalal Home Solution, Aliabad, Hunza",
    opened: "2020",
    note: "Full home furnishing range for Hunza valley.",
  },
  {
    id: "skardu-branch",
    brand: "pak-turk",
    brandLabel: "Pak Turk Carpets",
    name: "Skardu Branch",
    city: "Skardu",
    region: "Skardu District",
    address: "Pak Turk Carpet 2, 7JWR+XXH, Skardu, Gilgit-Baltistan, Pakistan",
    phone: "+923554948709",
    phoneDisplay: "0355 4948709",
    contacts: [
      { label: "Branch Office", phone: "+923554948709", phoneDisplay: "0355 4948709" },
      { label: "HR", phone: "+923554948708", phoneDisplay: "0355 4948708" },
      { label: "Management", phone: "+923135205272", phoneDisplay: "0313 5205272" },
    ],
    hours: "Open daily — call for exact hours",
    lat: 35.2971,
    lng: 75.6338,
    googleMapsQuery: "Pak Turk Carpets, Skardu",
    opened: "2022",
  },
  {
    id: "gakuch-branch",
    brand: "pak-turk",
    brandLabel: "Pak Turk Carpets",
    name: "Gakuch Branch",
    city: "Gakuch",
    region: "Ghizer District",
    address: "Near Higher Secondary School, Gakuch, Ghizer, Gilgit-Baltistan, Pakistan",
    phone: "+923555404571",
    phoneDisplay: "0355 5404571",
    contacts: [
      { label: "Branch Office", phone: "+923555404571", phoneDisplay: "0355 5404571" },
      { label: "HR", phone: "+923554948708", phoneDisplay: "0355 4948708" },
      { label: "Management", phone: "+923135205272", phoneDisplay: "0313 5205272" },
    ],
    hours: "Open daily — call for exact hours",
    lat: 36.184,
    lng: 73.763,
    googleMapsQuery: "Pak Turk Carpets, Gakuch, Ghizer",
    opened: "2024",
  },
  {
    id: "kashrot-branch",
    brand: "jalal-carpets",
    brandLabel: "Jalal Carpets",
    name: "Kashrot Branch",
    city: "Gilgit",
    region: "Gilgit District",
    address: "Kashrot, Gilgit, Gilgit-Baltistan, Pakistan",
    phone: "+923135205272",
    phoneDisplay: "0313 5205272",
    contacts: [
      { label: "Branch Office", phone: "+923135205272", phoneDisplay: "0313 5205272" },
      { label: "HR", phone: "+923554948708", phoneDisplay: "0355 4948708" },
      { label: "Management", phone: "+923135205272", phoneDisplay: "0313 5205272" },
    ],
    lat: 35.928,
    lng: 74.305,
    googleMapsQuery: "Jalal Carpets, Kashrot, Gilgit",
    opened: "2005",
    note: "Original store — where Jalal Uddin founded the business.",
  },
];

export const TOTAL_BRANCHES = branches.length;

export function googleMapsDirectionsUrl(branch: Branch): string {
  return googleMapsDirectionsFromQuery(branch.googleMapsQuery, branch.lat, branch.lng);
}

export function googleMapsPlaceUrl(branch: Branch): string {
  return googleMapsPlaceFromQuery(branch.googleMapsQuery);
}

export function googleMapsEmbedUrl(branch: Branch): string {
  return googleMapsEmbedFromQuery(branch.googleMapsQuery, branch.lat, branch.lng);
}

export function googleMapsEmbedFromQuery(query: string, lat?: number | null, lng?: number | null) {
  if (lat != null && lng != null) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&hl=en&z=16&output=embed`;
  }
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=en&z=16&output=embed`;
}

export function googleMapsDirectionsFromQuery(query: string, lat?: number | null, lng?: number | null) {
  const dest = lat != null && lng != null ? `${lat},${lng}` : encodeURIComponent(query);
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
}

export function googleMapsPlaceFromQuery(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function findStaticBranch(slug: string, city?: string): Branch | undefined {
  const key = slug.toLowerCase().replace(/-branch$/, "").trim();
  const bySlug = branches.find((branch) => branch.id.replace(/-branch$/, "") === key);
  if (bySlug) return bySlug;
  if (!city) return undefined;
  return branches.find((branch) => branch.city.toLowerCase() === city.toLowerCase());
}

export const regions = [...new Set(branches.map((b) => b.region))].sort();

export function branchesByRegion(): Record<string, Branch[]> {
  return branches.reduce<Record<string, Branch[]>>((acc, branch) => {
    if (!acc[branch.region]) acc[branch.region] = [];
    acc[branch.region].push(branch);
    return acc;
  }, {});
}
