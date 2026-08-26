export function promoMessagesFor(freeDeliveryThresholdMinor = 5_000_000) {
  const amount = new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(freeDeliveryThresholdMinor / 100);

  return [
    "✓ Trusted Since 2005",
    `✓ Free Delivery Above ${amount}`,
    "✓ Over 1,000 Premium Products",
    "✓ 5 Showrooms Across Gilgit-Baltistan",
    "✓ Easy Returns",
    "✓ Professional Installation",
  ];
}

export const promoMessages = promoMessagesFor();
export const trustFeatures = [
  {
    icon: "truck" as const,
    title: "Fast Delivery",
    description: "Nationwide shipping across Pakistan",
  },
  {
    icon: "ruler" as const,
    title: "Custom Sizing",
    description: "Made to fit your exact space",
  },
  {
    icon: "shield" as const,
    title: "Quality Guaranteed",
    description: "Premium materials & craftsmanship",
  },
  {
    icon: "store" as const,
    title: "5 Showrooms",
    description: "Visit us across Gilgit-Baltistan",
  },
];

export type ShopStyle = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
};

import { images } from "./images";

export const shopStyles: ShopStyle[] = [
  {
    id: "persian",
    title: "Persian Rugs",
    subtitle: "Traditional & classical",
    image: images.products.silkCarpet,
    href: "/shop?category=rugs",
  },
  {
    id: "turkish",
    title: "Turkish Rugs",
    subtitle: "Vintage & modern weave",
    image: images.products.woolRug,
    href: "/shop?category=rugs",
  },
  {
    id: "prayer",
    title: "Prayer Mats",
    subtitle: "Janamaz & saf carpets",
    image: images.products.heritageCarpet,
    href: "/shop?category=prayer-mats",
  },
  {
    id: "furniture",
    title: "Premium Furniture",
    subtitle: "Sofas, beds & dining",
    image: images.products.velvetSofa,
    href: "/shop?category=furniture",
  },
  {
    id: "flooring",
    title: "Flooring",
    subtitle: "Tiles, LVT & laminates",
    image: images.collections.carpets,
    href: "/shop?category=flooring",
  },
  {
    id: "decor",
    title: "Home Decor",
    subtitle: "Curtains, cushions & accents",
    image: images.collections.curtains,
    href: "/shop?category=decor",
  },
];
