import { listProducts } from "@/server/catalog/products";
import { formatMoney } from "@/lib/money";
import type { MatchedConsultationRule } from "./rules";
import type { ConsultationProfile } from "./profile";
import type { CatalogProductImage } from "@/types/catalog";

export type ConsultationRecommendation = {
  id: string;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  price: string;
  priceMinor: number;
  url: string;
  shortDescription: string | null;
  imageUrl: string | null;
  reason: string;
  score: number;
  inStock: boolean;
};

function primaryImageUrl(images: CatalogProductImage[]): string | null {
  return images.find((img) => img.isPrimary)?.url ?? images[0]?.url ?? null;
}

const COLOR_HINT_MAP: Record<string, string[]> = {
  light: ["white", "cream", "beige", "grey", "gray", "light", "ivory"],
  dark: ["black", "navy", "charcoal", "brown", "burgundy", "dark"],
  warm: ["gold", "mustard", "red", "orange", "warm", "terracotta"],
  cool: ["blue", "green", "teal", "cool"],
};

function scoreProduct(
  product: {
    name: string;
    shortDescription: string | null;
    description: string | null;
    fabric: string | null;
    design: string | null;
    salePriceMinor: number;
    stockStatus: string | null;
  },
  hints: {
    colorHints?: string[];
    styleHints?: string[];
    materialHints?: string[];
  }
) {
  const haystack = [product.name, product.shortDescription, product.description, product.fabric, product.design]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let score = 0;

  for (const hint of hints.colorHints ?? []) {
    if (haystack.includes(hint.toLowerCase())) score += 3;
  }

  for (const hint of hints.styleHints ?? []) {
    if (haystack.includes(hint.toLowerCase())) score += 2;
  }

  for (const hint of hints.materialHints ?? []) {
    if (haystack.includes(hint.toLowerCase())) score += 2;
  }

  if (product.stockStatus !== "out_of_stock") score += 1;

  return score;
}

export async function recommendConsultationProducts(input: {
  profile: ConsultationProfile;
  rules: MatchedConsultationRule[];
  limit?: number;
}): Promise<ConsultationRecommendation[]> {
  const limit = input.limit ?? 5;
  const topRule = input.rules[0];
  if (!topRule) return [];

  const categories =
    topRule.search.categories ??
    (input.profile.categorySlug ? [input.profile.categorySlug] : ["curtains", "carpets", "prayer-mats", "furniture", "table"]);

  const colorHints = [
    ...(topRule.search.color_hints ?? []),
    ...(input.profile.color ? COLOR_HINT_MAP[input.profile.color] ?? [input.profile.color] : []),
  ];

  const hints = {
    colorHints: [...new Set(colorHints)],
    styleHints: topRule.search.style_hints ?? (input.profile.style ? [input.profile.style] : []),
    materialHints: topRule.search.material_hints ?? (input.profile.material ? [input.profile.material.replace(/_/g, " ")] : []),
  };

  const collected: ConsultationRecommendation[] = [];

  for (const categorySlug of categories) {
    const result = await listProducts({
      categorySlug,
      pageSize: 20,
      sort: topRule.search.sort_by === "price_asc" ? "price_asc" : "name",
    });

    for (const product of result.items) {
      if (input.profile.budgetMaxMinor && product.salePriceMinor > input.profile.budgetMaxMinor) {
        continue;
      }

      const score = scoreProduct(product, hints);
      if (score <= 0 && (hints.colorHints.length || hints.styleHints.length)) continue;

      collected.push({
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.category.name,
        categorySlug: product.category.slug,
        price: formatMoney(product.salePriceMinor),
        priceMinor: product.salePriceMinor,
        url: `/products/${product.slug}`,
        shortDescription: product.shortDescription,
        imageUrl: primaryImageUrl(product.images),
        reason: topRule.explain,
        score: score + topRule.score,
        inStock: product.stockStatus !== "out_of_stock",
      });
    }
  }

  if (collected.length === 0) {
    for (const categorySlug of categories) {
      const result = await listProducts({ categorySlug, pageSize: 3, sort: "name" });
      for (const product of result.items) {
        if (input.profile.budgetMaxMinor && product.salePriceMinor > input.profile.budgetMaxMinor) {
          continue;
        }
        collected.push({
          id: product.id,
          name: product.name,
          slug: product.slug,
          category: product.category.name,
          categorySlug: product.category.slug,
          price: formatMoney(product.salePriceMinor),
          priceMinor: product.salePriceMinor,
          url: `/products/${product.slug}`,
          shortDescription: product.shortDescription,
          imageUrl: primaryImageUrl(product.images),
          reason: topRule.explain,
          score: 1,
          inStock: product.stockStatus !== "out_of_stock",
        });
      }
    }
  }

  return collected
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
