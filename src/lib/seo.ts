import type { Metadata } from "next";
import { company } from "./content";

/** Primary homepage H1 — keyword-rich for search, readable for customers */
export const homeHero = {
  headline: "Luxury Carpets, Rugs & Home Interiors Crafted for Elegant Living",
  accent: "Transform Your Home with Premium Quality Since 2005",
  subheadline:
    "Discover handcrafted carpets, luxury rugs, elegant furniture, flooring, curtains, and home décor. Shop over 1,000 premium products with custom sizing, expert installation, and nationwide delivery across Pakistan.",
};

export const siteMetadata: Metadata = {
  title: "Luxury Carpets, Rugs & Home Interiors | Jalals Home Solution Pakistan",
  description: homeHero.subheadline,
  keywords: [
    "carpets Pakistan",
    "rugs online Pakistan",
    "home furniture Pakistan",
    "premium carpets Gilgit Baltistan",
    "prayer mats Pakistan",
    "wall to wall carpet Pakistan",
    "Jalals Home Solution",
    "Jalals Group",
    "flooring Pakistan",
    "sofa sets Pakistan",
  ],
  openGraph: {
    title: "Luxury Carpets, Rugs & Home Interiors | Jalals Home Solution Pakistan",
    description: homeHero.subheadline,
    type: "website",
    locale: "en_PK",
    siteName: company.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Luxury Carpets, Rugs & Home Interiors | Jalals Home Solution Pakistan",
    description: homeHero.subheadline,
  },
  alternates: {
    canonical: "/",
  },
};

export const homeJsonLd = {
  "@context": "https://schema.org",
  "@type": "HomeGoodsStore",
  name: company.name,
  description: homeHero.subheadline,
  url: "https://jalalshome.pk",
  telephone: company.phone,
  email: company.email,
  address: {
    "@type": "PostalAddress",
    addressRegion: "Gilgit-Baltistan",
    addressCountry: "PK",
  },
  areaServed: {
    "@type": "Country",
    name: "Pakistan",
  },
  priceRange: "₨₨",
  knowsAbout: [
    "Carpets",
    "Rugs",
    "Home Furniture",
    "Flooring",
    "Prayer Mats",
    "Home Decor",
  ],
};
