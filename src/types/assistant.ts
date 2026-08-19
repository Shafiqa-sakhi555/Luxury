export type AssistantProductRecommendation = {
  id: string;
  name: string;
  slug: string;
  category: string;
  categorySlug?: string;
  price: string;
  priceMinor?: number;
  url: string;
  shortDescription: string | null;
  imageUrl?: string | null;
  reason?: string;
  inStock?: boolean;
};
