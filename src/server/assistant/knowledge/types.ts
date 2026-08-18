export type VerifiedMeta = {
  verified?: boolean;
  placeholder?: boolean;
  source?: string;
  last_updated?: string;
};

export type CompanyKnowledge = VerifiedMeta & {
  company_name: string;
  legal_brands: Array<{ id: string; name: string; focus: string }>;
  website: string;
  description: string;
  tagline?: string;
  location: string;
  established: number;
  history_summary: string;
  mission: string;
  vision: string;
  values: string[];
  leadership: Array<{ name: string; title: string; bio?: string }>;
  milestones: Array<{ year: string; event: string }>;
  services: string[];
  contact: Record<string, string>;
  social_links: string[];
  notes?: string;
};

export type BranchRecord = {
  branch_id: string;
  name: string;
  brand?: string;
  city: string;
  region?: string;
  address: string;
  phone: string;
  phone_display?: string;
  email?: string;
  contacts?: Array<{ label: string; phone: string }>;
  opening_hours: string | Record<string, string>;
  services: string[];
  latitude: number | null;
  longitude: number | null;
  is_flagship?: boolean;
  opened?: string;
  note?: string;
};

export type BranchKnowledge = VerifiedMeta & {
  branches: BranchRecord[];
  stock_note?: string;
};

export type FaqEntry = VerifiedMeta & {
  id: string;
  question: string;
  answer: string;
  category: string;
  note?: string;
};

export type FaqKnowledge = {
  faqs: FaqEntry[];
  last_updated?: string;
};

export type CategoryKnowledge = VerifiedMeta & {
  slug: string;
  name: string;
  description: string;
  typical_applications: string[];
  suitable_rooms: string[];
  available_materials: string[];
  available_styles: string[];
  price_range_note?: string;
  installation_requirements?: string;
  maintenance_considerations?: string;
  common_customer_questions: string[];
  related_categories: string[];
  spec_fields?: string[];
};

/** Static product snapshot for RAG — excludes live price/stock */
export type ProductKnowledgeRecord = {
  product_id: string;
  sku: string | null;
  slug: string;
  name: string;
  category: string;
  category_slug: string;
  brand?: string;
  short_description: string | null;
  description: string | null;
  material: string | null;
  fabric: string | null;
  design: string | null;
  size: string | null;
  selling_unit: string | null;
  included_items: string | null;
  styles: string[];
  rooms: string[];
  indoor_outdoor: "indoor" | "outdoor" | "both" | null;
  tags: string[];
  search_keywords: string[];
  images: string[];
  variants: Array<{
    variant_id: string;
    sku: string;
    name: string | null;
    color: string | null;
    design: string | null;
    size: string | null;
    quality: string | null;
  }>;
  specifications: Array<{ key: string; value: string }>;
  related_products: string[];
  complementary_products: string[];
  alternative_products: string[];
  created_at: string;
  updated_at: string;
  /** Explicit marker — prices must come from live tools */
  pricing_source: "live_database";
  is_canonical_category?: boolean;
};

export type ProductExportManifest = VerifiedMeta & {
  exported_at: string;
  product_count: number;
  canonical_product_count?: number;
  canonical_categories?: string[];
  categories: string[];
  products: ProductKnowledgeRecord[];
};

export type KnowledgeChunkMeta = {
  sourceType:
    | "company"
    | "faq"
    | "policy"
    | "product"
    | "category"
    | "design"
    | "support"
    | "glossary"
    | "branch"
    | "order";
  sourceId: string;
  productId?: string;
  categoryId?: string;
  contentType: string;
  language: "en";
  verified: boolean;
  updatedAt: string;
};

export type StaticVsLiveBoundary = {
  static: string[];
  live: string[];
  llm: string[];
};

export const STATIC_VS_LIVE: StaticVsLiveBoundary = {
  static: [
    "Company overview, history, leadership (verified only)",
    "FAQs and policies",
    "Product descriptions, specs, categories (no prices/stock)",
    "Design consultation rules",
    "Support procedures",
    "Glossary",
    "Order status definitions",
  ],
  live: [
    "Current price and sale price",
    "Warehouse and branch stock",
    "Order status for a customer",
    "Cart and wishlist",
    "Active coupons and promotions",
  ],
  llm: [
    "Understanding customer intent",
    "Design consultation dialogue",
    "Explaining recommendations from tool results",
    "Summarisation and natural language",
  ],
};
