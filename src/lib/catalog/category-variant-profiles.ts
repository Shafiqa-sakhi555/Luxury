import type { CategorySizePresetKey } from "@/lib/catalog/category-size-presets";

export type CategoryVariantProfile = {
  /** Singular label for one option (e.g. "Size", "Configuration"). */
  optionLabel: string;
  optionLabelPlural: string;
  /** Preset keys suggested for this category type. */
  suggestedPresets: CategorySizePresetKey[];
  /** Show width × length fields on custom options (rugs, curtains). */
  showCustomDimensions: boolean;
  /** Show furniture fields: details, pieces, material, finish. */
  showFurnitureFields: boolean;
  /** Allow editing the label on custom category options. */
  editableCustomLabels: boolean;
};

const DEFAULT_PROFILE: CategoryVariantProfile = {
  optionLabel: "Size",
  optionLabelPlural: "Sizes",
  suggestedPresets: ["rugs", "blankets", "bedsheets", "towels", "curtains"],
  showCustomDimensions: true,
  showFurnitureFields: false,
  editableCustomLabels: false,
};

const FURNITURE_PROFILE: CategoryVariantProfile = {
  optionLabel: "Configuration",
  optionLabelPlural: "Configurations",
  suggestedPresets: ["furniture", "tables", "diningSets"],
  showCustomDimensions: false,
  showFurnitureFields: true,
  editableCustomLabels: true,
};

const TABLE_SLUGS = new Set(["table", "tables"]);
const DINING_SLUGS = new Set(["dining-set", "dining-sets", "dining-set"]);
const FURNITURE_SLUGS = new Set([
  "furniture",
  "sofa",
  "chair",
  "beds",
  "bed",
  "cupboard",
  "wardrobe",
  "storage",
]);

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

function matchesAny(slug: string, name: string, tokens: string[]): boolean {
  const haystack = `${slug} ${name}`.toLowerCase();
  return tokens.some((token) => haystack.includes(token));
}

/** Resolve admin + storefront labels/fields from category slug or name. */
export function getCategoryVariantProfile(
  slug: string | null | undefined,
  name?: string | null
): CategoryVariantProfile {
  const normalizedSlug = normalizeToken(slug ?? "");
  const normalizedName = (name ?? "").trim().toLowerCase();

  if (
    TABLE_SLUGS.has(normalizedSlug) ||
    matchesAny(normalizedSlug, normalizedName, ["table", "desk", "console"])
  ) {
    return {
      ...FURNITURE_PROFILE,
      suggestedPresets: ["tables", "furniture"],
    };
  }

  if (
    DINING_SLUGS.has(normalizedSlug) ||
    matchesAny(normalizedSlug, normalizedName, ["dining set", "dining-set", "dining room set"])
  ) {
    return {
      ...FURNITURE_PROFILE,
      optionLabel: "Set option",
      optionLabelPlural: "Set options",
      suggestedPresets: ["diningSets"],
    };
  }

  if (
    FURNITURE_SLUGS.has(normalizedSlug) ||
    matchesAny(normalizedSlug, normalizedName, ["furniture", "sofa", "chair", "bed", "cupboard", "wardrobe"])
  ) {
    return FURNITURE_PROFILE;
  }

  return DEFAULT_PROFILE;
}
