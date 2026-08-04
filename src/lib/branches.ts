export type BranchBrand = "jalals-home" | "pak-turk" | "jalal-carpets";

export type Branch = {
  id: string;
  brand: BranchBrand;
  brandLabel: string;
  name: string;
  city: string;
  region: string;
  address: string;
  phone: string;
  phoneDisplay: string;
  hours?: string;
  /** Approximate coordinates for map embed — verify with client */
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

export const branches: Branch[] = [
  {
    id: "gilgit-flagship",
    brand: "jalals-home",
    brandLabel: "Jalal's Home Solution",
    name: "Gilgit Flagship Showroom",
    city: "Gilgit",
    region: "Gilgit District",
    address:
      "W929+R2G, Shahr-e-Quaid-e-Azam, opposite Supreme Appellate Court, Jutial, Gilgit",
    phone: "+923135205272",
    phoneDisplay: "0313 5205272",
    hours: "Open daily — call for exact hours",
    lat: 35.9194,
    lng: 74.3178,
    googleMapsQuery:
      "Jalal's Home Solution, Supreme Appellate Court, Jutial, Gilgit",
    googleRating: 4.5,
    googleReviewCount: 33,
    isFlagship: true,
  },
  {
    id: "pak-turk-jutial",
    brand: "pak-turk",
    brandLabel: "Pak Turk Carpets",
    name: "Jutial Showroom",
    city: "Gilgit",
    region: "Gilgit District",
    address: "Jutial, Gilgit — opposite Askari Bank, Snow Leopard Shopping Complex area",
    phone: "+923555404571",
    phoneDisplay: "0355 5404571",
    hours: "Open daily — call for exact hours",
    lat: 35.9083,
    lng: 74.3583,
    googleMapsQuery: "Pak Turk Carpets, Jutial, Gilgit",
    opened: "2010s",
    note: "Premium Turkish rugs and carpets.",
  },
  {
    id: "jalal-carpets-kashrot",
    brand: "jalal-carpets",
    brandLabel: "Jalal Carpets",
    name: "Kashrot (Original Store)",
    city: "Gilgit",
    region: "Gilgit District",
    address: "Kashrot, Gilgit",
    phone: "+923135205272",
    phoneDisplay: "0313 5205272",
    lat: 35.928,
    lng: 74.305,
    googleMapsQuery: "Jalal Carpets, Kashrot, Gilgit",
    opened: "2005",
    note: "Where Jalal Uddin founded the business — rugs and wall-to-wall carpets.",
  },
  {
    id: "jalals-hunza",
    brand: "jalals-home",
    brandLabel: "Jalal's Home Solution",
    name: "Aliabad, Hunza",
    city: "Hunza",
    region: "Hunza District",
    address: "Hospital Road, Aliabad, Hunza",
    phone: "+923554323944",
    phoneDisplay: "0355 4323944",
    hours: "Open daily — call for exact hours",
    lat: 36.3075,
    lng: 74.6675,
    googleMapsQuery: "Jalal Home Solution, Aliabad, Hunza",
    opened: "2020",
    note: "Full home furnishing range for Hunza valley.",
  },
  {
    id: "pak-turk-skardu",
    brand: "pak-turk",
    brandLabel: "Pak Turk Carpets",
    name: "Skardu Branch",
    city: "Skardu",
    region: "Skardu District",
    address: "Khushobagh, near GPO, Skardu",
    phone: "+923555404571",
    phoneDisplay: "0355 5404571",
    lat: 35.2971,
    lng: 75.6338,
    googleMapsQuery: "Pak Turk Carpets, Skardu",
    opened: "2022",
  },
  {
    id: "pak-turk-gakuch",
    brand: "pak-turk",
    brandLabel: "Pak Turk Carpets",
    name: "Gakuch Branch",
    city: "Gakuch",
    region: "Ghizer District",
    address: "Near Higher Secondary School, Gakuch, Ghizer",
    phone: "+923555404571",
    phoneDisplay: "0355 5404571",
    lat: 36.184,
    lng: 73.763,
    googleMapsQuery: "Pak Turk Carpets, Gakuch, Ghizer",
    opened: "2024",
  },
];

export function googleMapsDirectionsUrl(branch: Branch): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`;
}

export function googleMapsPlaceUrl(branch: Branch): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.googleMapsQuery)}`;
}

export function googleMapsEmbedUrl(branch: Branch): string {
  const q = encodeURIComponent(`${branch.lat},${branch.lng}`);
  return `https://maps.google.com/maps?q=${q}&hl=en&z=16&output=embed`;
}

export const regions = [...new Set(branches.map((b) => b.region))].sort();

export function branchesByRegion(): Record<string, Branch[]> {
  return branches.reduce<Record<string, Branch[]>>((acc, branch) => {
    if (!acc[branch.region]) acc[branch.region] = [];
    acc[branch.region].push(branch);
    return acc;
  }, {});
}
