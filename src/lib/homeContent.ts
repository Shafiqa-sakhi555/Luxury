import { images } from "./images";

export const heroContent = {
  badge: "Gilgit-Baltistan, Pakistan",
  headline: "Luxury Carpets, Rugs & Home Interiors Crafted for Elegant Living",
  headlineAlt: "Transform Your Home with Premium Carpets, Rugs & Furniture",
  subtitle:
    "Discover handcrafted carpets, luxury rugs, elegant furniture, flooring, curtains, and home décor. Shop over 1,000 premium products with custom sizing, expert installation, and nationwide delivery across Pakistan.",
  searchPlaceholder: "Search carpets, rugs, furniture...",
  categoryLabel: "Browse Categories",
  searchButton: "Find Products",
  primaryCta: { label: "Explore Collection", href: "/shop" },
  secondaryCta: { label: "Book Free Consultation", href: "/contact" },
};

export const heroTrustBadges = [
  { icon: "shield" as const, label: "Trusted Since 2005" },
  { icon: "truck" as const, label: "Free Delivery Above ₨50,000" },
  { icon: "wrench" as const, label: "Installation Available" },
  { icon: "ruler" as const, label: "Custom Sizes" },
  { icon: "award" as const, label: "Premium Quality Guaranteed" },
];

export const heroStats = [
  { value: 1000, suffix: "+", label: "Premium Products" },
  { value: 20, suffix: "+", label: "Years Experience" },
  { value: 5, suffix: "", label: "Showrooms" },
  { value: 50000, suffix: "+", label: "Satisfied Customers" },
  { value: 0, suffix: "", label: "Nationwide Delivery", textValue: "Nationwide" },
];

export const featuredCategories = [
  {
    slug: "carpets",
    title: "Luxury Carpets",
    image: images.collections.carpets,
    href: "/shop?category=carpets",
  },
  {
    slug: "rugs",
    title: "Modern Rugs",
    image: images.collections.rugs,
    href: "/shop?category=rugs",
  },
  {
    slug: "furniture",
    title: "Furniture",
    image: images.collections.sofas,
    href: "/shop?category=furniture",
  },
  {
    slug: "curtains",
    title: "Curtains",
    image: images.collections.curtains,
    href: "/shop?category=curtains",
  },
  {
    slug: "flooring",
    title: "Flooring",
    image: images.products.silkCarpet,
    href: "/shop?category=flooring",
  },
  {
    slug: "decor",
    title: "Home Decor",
    image: images.collections.cushions,
    href: "/shop?category=decor",
  },
];

export const whyChooseUs = [
  {
    icon: "calendar" as const,
    title: "Trusted Since 2005",
    description: "Two decades of excellence serving homes across Gilgit-Baltistan and Pakistan.",
  },
  {
    icon: "gem" as const,
    title: "Premium Imported Materials",
    description: "Hand-selected wool, silk, hardwood and fabrics from trusted global suppliers.",
  },
  {
    icon: "ruler" as const,
    title: "Custom Sizing",
    description: "Carpets, rugs and furniture tailored to your exact room dimensions.",
  },
  {
    icon: "wrench" as const,
    title: "Professional Installation",
    description: "Expert fitting for carpets, flooring and large furniture — done right the first time.",
  },
  {
    icon: "truck" as const,
    title: "Nationwide Delivery",
    description: "Secure packaging and reliable shipping to every major city in Pakistan.",
  },
  {
    icon: "headphones" as const,
    title: "Dedicated Customer Support",
    description: "Personal guidance from showroom experts and responsive after-sales care.",
  },
];

export const aiDesignerContent = {
  id: "ai-designer",
  eyebrow: "AI-Powered Design",
  title: "Visualize Before You Buy",
  description:
    "Upload a photo of your room and instantly preview carpets, rugs, furniture and curtains using our AI-powered room designer.",
  cta: { label: "Try AI Designer", href: "/contact" },
  image: images.sections.advisor,
};
