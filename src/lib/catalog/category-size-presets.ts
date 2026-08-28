/** Preset size lists admins can apply when configuring a category. */
export const CATEGORY_SIZE_PRESETS = {
  rugs: {
    label: "Rugs / Carpets",
    sizes: ["2 × 3 ft", "3 × 5 ft", "4 × 6 ft", "5 × 7 ft", "6 × 9 ft", "8 × 10 ft", "Custom Size"],
    customLabels: ["Custom Size"],
  },
  blankets: {
    label: "Blankets",
    sizes: ["Single", "Double", "Queen", "King", "Super King"],
    customLabels: [] as string[],
  },
  bedsheets: {
    label: "Bedsheets",
    sizes: ["Single", "Double", "Queen", "King", "Super King"],
    customLabels: [] as string[],
  },
  towels: {
    label: "Towels",
    sizes: ["Small", "Medium", "Large", "Set"],
    customLabels: [] as string[],
  },
  curtains: {
    label: "Curtains",
    sizes: ["4 ft", "5 ft", "6 ft", "7 ft", "8 ft", "9 ft", "Custom Size"],
    customLabels: ["Custom Size"],
  },
  furniture: {
    label: "Furniture (general)",
    sizes: [
      "Single piece",
      "2-seater",
      "3-seater",
      "L-shape",
      "Sectional",
      "With storage",
      "Custom configuration",
    ],
    customLabels: ["Custom configuration"],
  },
  tables: {
    label: "Tables",
    sizes: [
      "Side table",
      "Coffee table",
      "2-seater",
      "4-seater",
      "6-seater",
      "8-seater",
      "Extendable",
      "Custom configuration",
    ],
    customLabels: ["Custom configuration"],
  },
  diningSets: {
    label: "Dining sets",
    sizes: [
      "2-piece set",
      "4-piece set",
      "6-piece set",
      "8-piece set",
      "10-piece set",
      "Table + chairs",
      "Custom set",
    ],
    customLabels: ["Custom set"],
  },
} as const;

export type CategorySizePresetKey = keyof typeof CATEGORY_SIZE_PRESETS;

export function buildSizesFromPreset(
  presetKey: CategorySizePresetKey,
  existing: Array<{ label: string }>
): Array<{ label: string; sortOrder: number; isActive: boolean; isCustom: boolean }> {
  const preset = CATEGORY_SIZE_PRESETS[presetKey];
  const taken = new Set(existing.map((size) => size.label.trim().toLowerCase()).filter(Boolean));
  const customSet = new Set(preset.customLabels.map((label) => label.toLowerCase()));

  const additions = preset.sizes
    .filter((label) => !taken.has(label.toLowerCase()))
    .map((label, index) => ({
      label,
      sortOrder: existing.length + index,
      isActive: true,
      isCustom: customSet.has(label.toLowerCase()),
    }));

  return additions;
}
