import { images } from "@/lib/images";

export type Product = {
  id: string;
  title: string;
  location: string;
  price: number;
  rating: number;
  image: string;
  badge?: string;
  category: string;
};

export type Showroom = {
  id: string;
  name: string;
  region: string;
  image: string;
  products: number;
};

export type CraftStep = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  step: string;
};

export type Collection = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  count: number;
};

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  quote: string;
  image: string;
  rating: number;
};

export type JournalPost = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  date: string;
  readTime: string;
};

export type GBCity = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  products: number;
};

export const showrooms: Showroom[] = [
  {
    id: "1",
    name: "Gilgit",
    region: "Gilgit City",
    image: images.showrooms.gilgit,
    products: 320,
  },
  {
    id: "2",
    name: "Hunza",
    region: "Hunza Valley",
    image: images.showrooms.hunza,
    products: 185,
  },
  {
    id: "3",
    name: "Skardu",
    region: "Skardu District",
    image: images.showrooms.skardu,
    products: 210,
  },
  {
    id: "4",
    name: "Ghizer",
    region: "Ghizer Valley",
    image: images.showrooms.ghizer,
    products: 95,
  },
  {
    id: "5",
    name: "Astore",
    region: "Astore Valley",
    image: images.showrooms.astore,
    products: 78,
  },
  {
    id: "6",
    name: "Nagar",
    region: "Nagar District",
    image: images.showrooms.nagar,
    products: 64,
  },
];

export const products: Product[] = [
  {
    id: "1",
    title: "Hunza Heritage Carpet",
    location: "Hand-knotted · 8×10 ft",
    price: 85000,
    rating: 4.9,
    image: images.products.heritageCarpet,
    badge: "Bestseller",
    category: "carpet",
  },
  {
    id: "2",
    title: "Royal Velvet Sofa Set",
    location: "3+2+1 · Premium Fabric",
    price: 145000,
    rating: 4.8,
    image: images.products.velvetSofa,
    badge: "New",
    category: "sofa",
  },
  {
    id: "3",
    title: "Gilgit Wool Rug",
    location: "Traditional · 6×9 ft",
    price: 42000,
    rating: 4.9,
    image: images.products.woolRug,
    badge: "Handmade",
    category: "rug",
  },
  {
    id: "4",
    title: "Mountain View Sectional",
    location: "L-Shape · Leather Finish",
    price: 198000,
    rating: 4.7,
    image: images.products.sectionalSofa,
    category: "sofa",
  },
  {
    id: "5",
    title: "Silk Kashan Carpet",
    location: "Silk blend · 5×7 ft",
    price: 120000,
    rating: 5.0,
    image: images.products.silkCarpet,
    badge: "Premium",
    category: "carpet",
  },
  {
    id: "6",
    title: "Comfort Lounge Chair",
    location: "Single · Ottoman Included",
    price: 35000,
    rating: 4.6,
    image: images.products.loungeChair,
    category: "sofa",
  },
  {
    id: "7",
    title: "Velvet Window Curtains",
    location: "Pair · 8 ft height",
    price: 18000,
    rating: 4.7,
    image: images.products.velvetCurtains,
    badge: "Popular",
    category: "curtain",
  },
  {
    id: "8",
    title: "Luxury King Bed Set",
    location: "Frame + Mattress + Side tables",
    price: 95000,
    rating: 4.8,
    image: images.products.luxuryBed,
    category: "bed",
  },
  {
    id: "9",
    title: "Traditional Kilim Rug",
    location: "Handwoven · 4×6 ft",
    price: 28000,
    rating: 4.9,
    image: images.products.kilimRug,
    category: "rug",
  },
];

export const craftSteps: CraftStep[] = [
  {
    id: "1",
    title: "Hand-Selected Materials",
    subtitle: "Premium wool, silk threads, and finest hardwood sourced from Gilgit Baltistan valleys",
    image: images.craft.materials,
    step: "Step 01",
  },
  {
    id: "2",
    title: "Master Artisan Weaving",
    subtitle: "Generations of carpet-weaving tradition passed down through GB craftspeople",
    image: images.craft.weaving,
    step: "Step 02",
  },
  {
    id: "3",
    title: "Quality & Delivery",
    subtitle: "Every piece inspected, packed with care, and delivered across Pakistan",
    image: images.craft.delivery,
    step: "Step 03",
  },
];

export const collections: Collection[] = [
  {
    id: "1",
    title: "Handmade Carpets",
    subtitle: "Traditional & modern designs",
    image: images.collections.carpets,
    count: 240,
  },
  {
    id: "2",
    title: "Sofa Sets",
    subtitle: "Comfort meets elegance",
    image: images.collections.sofas,
    count: 86,
  },
  {
    id: "3",
    title: "Curtains & Drapes",
    subtitle: "Dress your windows beautifully",
    image: images.collections.curtains,
    count: 120,
  },
  {
    id: "4",
    title: "Beds & Mattresses",
    subtitle: "Rest in mountain comfort",
    image: images.collections.beds,
    count: 54,
  },
  {
    id: "5",
    title: "Cushions & Throws",
    subtitle: "Warmth for cold GB nights",
    image: images.collections.cushions,
    count: 95,
  },
  {
    id: "6",
    title: "Traditional Rugs",
    subtitle: "Gilgit Baltistan heritage",
    image: images.collections.rugs,
    count: 68,
  },
];

export const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Fatima Khan",
    role: "Gilgit City",
    quote: "The Hunza Heritage Carpet transformed our living room. The quality is outstanding — you can feel the craftsmanship in every knot. Best furniture shop in Gilgit Baltistan!",
    image: images.testimonials.fatima,
    rating: 5,
  },
  {
    id: "2",
    name: "Ahmed Hassan",
    role: "Skardu",
    quote: "Ordered a complete sofa set for our guest house. Delivery was fast, prices are fair, and the team helped us choose the perfect colors for our mountain lodge.",
    image: images.testimonials.ahmed,
    rating: 5,
  },
  {
    id: "3",
    name: "Sana Ali",
    role: "Hunza Valley",
    quote: "Lexury's custom carpet service is incredible. They made exactly what we wanted — traditional patterns with modern colors. Highly recommended across GB!",
    image: images.testimonials.sana,
    rating: 5,
  },
];

export const journalPosts: JournalPost[] = [
  {
    id: "1",
    title: "How to Care for Your Handmade Carpet in Cold Climates",
    excerpt: "Expert tips for maintaining wool carpets through Gilgit Baltistan's harsh winters.",
    category: "Care Tips",
    image: images.journal.carpetCare,
    date: "Mar 15, 2026",
    readTime: "5 min",
  },
  {
    id: "2",
    title: "Choosing the Perfect Sofa for Your Mountain Home",
    excerpt: "Warm fabrics, durable frames, and colors that complement GB's stunning landscapes.",
    category: "Guide",
    image: images.journal.sofaGuide,
    date: "Mar 10, 2026",
    readTime: "7 min",
  },
  {
    id: "3",
    title: "The Art of Gilgit Baltistan Carpet Weaving",
    excerpt: "Discover centuries-old weaving traditions that make our carpets truly unique.",
    category: "Heritage",
    image: images.journal.weaving,
    date: "Mar 5, 2026",
    readTime: "6 min",
  },
];

export const gbCities: GBCity[] = [
  { id: "1", name: "Gilgit", lat: 35.9208, lng: 74.3144, products: 320 },
  { id: "2", name: "Hunza", lat: 36.3167, lng: 74.65, products: 185 },
  { id: "3", name: "Skardu", lat: 35.2971, lng: 75.6338, products: 210 },
  { id: "4", name: "Ghizer", lat: 36.175, lng: 73.758, products: 95 },
  { id: "5", name: "Astore", lat: 35.3667, lng: 74.85, products: 78 },
  { id: "6", name: "Nagar", lat: 36.25, lng: 74.5833, products: 64 },
];

export const stats = [
  { label: "Products Available", value: 950, suffix: "+" },
  { label: "Happy Customers", value: 4200, suffix: "+" },
  { label: "Customer Satisfaction", value: 98, suffix: "%" },
  { label: "GB Showrooms", value: 6, suffix: "" },
];

export const membershipPlans = [
  {
    id: "basic",
    name: "Home",
    price: 0,
    period: "free",
    features: [
      "Browse full catalog",
      "Standard delivery across GB",
      "Product care guides",
      "WhatsApp support",
    ],
    highlighted: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: 4999,
    period: "year",
    features: [
      "10% discount on all items",
      "Free delivery in Gilgit Baltistan",
      "Priority custom orders",
      "Extended 2-year warranty",
      "Seasonal home decor tips",
    ],
    highlighted: true,
  },
  {
    id: "dealer",
    name: "Dealer",
    price: 14999,
    period: "year",
    features: [
      "25% wholesale pricing",
      "Bulk order priority",
      "Dedicated account manager",
      "Custom branding options",
      "Nationwide delivery network",
    ],
    highlighted: false,
  },
];

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(price);
}

export { images };
