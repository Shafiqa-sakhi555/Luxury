"use client";

import { useMemo } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { AdminButton, AdminInput, AdminLabel, AdminSelect, AdminTextarea } from "@/components/admin/ui";
import type { CategoryVariantProfile } from "@/lib/catalog/category-variant-profiles";
import type { AdminCategorySize } from "@/types/category-sizes";
import type { AdminProductVariantInput, DimensionUnit } from "@/types/category-sizes";

const DIMENSION_UNITS: DimensionUnit[] = ["ft", "in", "cm", "m"];

type ProductSizeVariantEditorProps = {
  categorySizes: AdminCategorySize[];
  variants: AdminProductVariantInput[];
  onChange: (variants: AdminProductVariantInput[]) => void;
  productSlug?: string;
  disabled?: boolean;
  profile?: CategoryVariantProfile;
};

function buildDefaultSku(productSlug: string | undefined, sizeLabel: string) {
  const base = (productSlug || "SKU").toUpperCase().replace(/-/g, "_");
  const suffix = sizeLabel
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 8)
    .toUpperCase();
  return suffix ? `${base}-${suffix}` : base;
}

function readAttribute(variant: AdminProductVariantInput, key: string): string {
  return variant.attributes?.[key] ?? "";
}

function patchAttributes(
  variant: AdminProductVariantInput,
  patch: Record<string, string>
): Record<string, string> {
  const next = { ...(variant.attributes ?? {}) };
  for (const [key, value] of Object.entries(patch)) {
    const trimmed = value.trim();
    if (trimmed) next[key] = trimmed;
    else delete next[key];
  }
  return next;
}

export function ProductSizeVariantEditor({
  categorySizes,
  variants,
  onChange,
  productSlug,
  disabled = false,
  profile,
}: ProductSizeVariantEditorProps) {
  const optionLabel = profile?.optionLabel ?? "Size";
  const optionLabelPlural = profile?.optionLabelPlural ?? "Sizes";
  const showCustomDimensions = profile?.showCustomDimensions ?? true;
  const showFurnitureFields = profile?.showFurnitureFields ?? false;

  const activeSizes = useMemo(
    () => categorySizes.filter((size) => size.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [categorySizes]
  );

  const selectedSizeIds = new Set(variants.map((variant) => variant.categorySizeId));

  function toggleSize(size: AdminCategorySize, checked: boolean) {
    if (checked) {
      onChange([
        ...variants,
        {
          categorySizeId: size.id,
          sizeLabel: size.label,
          isCustom: size.isCustom,
          sku: buildDefaultSku(productSlug, size.label),
          originalPriceMajor: 0,
          salePriceMajor: 0,
          stockQuantity: 0,
          attributes: {},
          isDefault: variants.length === 0,
        },
      ]);
      return;
    }

    onChange(variants.filter((variant) => variant.categorySizeId !== size.id));
  }

  function updateVariant(categorySizeId: string, patch: Partial<AdminProductVariantInput>) {
    onChange(
      variants.map((variant) =>
        variant.categorySizeId === categorySizeId ? { ...variant, ...patch } : variant
      )
    );
  }

  function updateVariantAttribute(categorySizeId: string, key: string, value: string) {
    onChange(
      variants.map((variant) => {
        if (variant.categorySizeId !== categorySizeId) return variant;
        return {
          ...variant,
          attributes: patchAttributes(variant, { [key]: value }),
        };
      })
    );
  }

  function removeVariant(categorySizeId: string) {
    onChange(variants.filter((variant) => variant.categorySizeId !== categorySizeId));
  }

  function moveVariant(categorySizeId: string, direction: -1 | 1) {
    const index = variants.findIndex((variant) => variant.categorySizeId === categorySizeId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= variants.length) return;
    const next = [...variants];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onChange(next);
  }

  if (activeSizes.length === 0) {
    return (
      <p className="text-sm text-muted">
        This category has no {optionLabelPlural.toLowerCase()} configured. Add them under Admin →
        Categories, or use the simple pricing fields below.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-navy">Available {optionLabelPlural.toLowerCase()}</h3>
        <p className="mt-0.5 text-xs text-muted">
          Select one or more {optionLabelPlural.toLowerCase()}, then enter price, stock, and details for each.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {activeSizes.map((size) => (
            <label
              key={size.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy"
            >
              <input
                type="checkbox"
                checked={selectedSizeIds.has(size.id)}
                disabled={disabled}
                onChange={(event) => toggleSize(size, event.target.checked)}
                className="rounded border-navy/20"
              />
              {size.label}
            </label>
          ))}
        </div>
      </div>

      {variants.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-navy">
            {optionLabel} &amp; pricing
          </h3>
          {variants.map((variant, index) => (
            <details key={variant.categorySizeId} open className="rounded-lg border border-navy/10 bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <span className="font-medium text-navy">
                  {readAttribute(variant, "customLabel") || variant.sizeLabel}
                </span>
                <div className="flex items-center gap-1">
                  <AdminButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled || index === 0}
                    onClick={(event) => {
                      event.preventDefault();
                      moveVariant(variant.categorySizeId, -1);
                    }}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </AdminButton>
                  <AdminButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled || index === variants.length - 1}
                    onClick={(event) => {
                      event.preventDefault();
                      moveVariant(variant.categorySizeId, 1);
                    }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </AdminButton>
                  <AdminButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    onClick={(event) => {
                      event.preventDefault();
                      removeVariant(variant.categorySizeId);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red" />
                  </AdminButton>
                </div>
              </summary>

              <div className="space-y-3 border-t border-navy/10 px-4 py-4">
                {variant.isCustom && showFurnitureFields && (
                  <div>
                    <AdminLabel>Custom option name</AdminLabel>
                    <AdminInput
                      disabled={disabled}
                      placeholder="e.g. 8-seater with bench"
                      value={readAttribute(variant, "customLabel")}
                      onChange={(event) =>
                        updateVariantAttribute(variant.categorySizeId, "customLabel", event.target.value)
                      }
                    />
                  </div>
                )}

                {variant.isCustom && showCustomDimensions && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <AdminLabel>Width</AdminLabel>
                      <AdminInput
                        type="number"
                        min="0"
                        step="0.01"
                        disabled={disabled}
                        value={variant.customWidth ?? ""}
                        onChange={(event) =>
                          updateVariant(variant.categorySizeId, {
                            customWidth: Number(event.target.value) || undefined,
                          })
                        }
                      />
                    </div>
                    <div>
                      <AdminLabel>Width unit</AdminLabel>
                      <AdminSelect
                        disabled={disabled}
                        value={variant.customWidthUnit ?? "ft"}
                        onChange={(event) =>
                          updateVariant(variant.categorySizeId, {
                            customWidthUnit: event.target.value as DimensionUnit,
                          })
                        }
                      >
                        {DIMENSION_UNITS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </AdminSelect>
                    </div>
                    <div>
                      <AdminLabel>Length</AdminLabel>
                      <AdminInput
                        type="number"
                        min="0"
                        step="0.01"
                        disabled={disabled}
                        value={variant.customLength ?? ""}
                        onChange={(event) =>
                          updateVariant(variant.categorySizeId, {
                            customLength: Number(event.target.value) || undefined,
                          })
                        }
                      />
                    </div>
                    <div>
                      <AdminLabel>Length unit</AdminLabel>
                      <AdminSelect
                        disabled={disabled}
                        value={variant.customLengthUnit ?? "ft"}
                        onChange={(event) =>
                          updateVariant(variant.categorySizeId, {
                            customLengthUnit: event.target.value as DimensionUnit,
                          })
                        }
                      >
                        {DIMENSION_UNITS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </AdminSelect>
                    </div>
                  </div>
                )}

                {showFurnitureFields && (
                  <div>
                    <AdminLabel>Configuration details</AdminLabel>
                    <AdminTextarea
                      rows={3}
                      disabled={disabled}
                      placeholder="Describe this option — e.g. table 180×90 cm, 6 chairs, bench included"
                      value={readAttribute(variant, "details")}
                      onChange={(event) =>
                        updateVariantAttribute(variant.categorySizeId, "details", event.target.value)
                      }
                    />
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <AdminLabel>Regular price (Rs)</AdminLabel>
                    <AdminInput
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={disabled}
                      value={variant.originalPriceMajor || ""}
                      onChange={(event) =>
                        updateVariant(variant.categorySizeId, {
                          originalPriceMajor: Number(event.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <AdminLabel>Sale price (Rs)</AdminLabel>
                    <AdminInput
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={disabled}
                      value={variant.salePriceMajor || ""}
                      onChange={(event) =>
                        updateVariant(variant.categorySizeId, {
                          salePriceMajor: Number(event.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <AdminLabel>Stock quantity</AdminLabel>
                    <AdminInput
                      type="number"
                      min="0"
                      disabled={disabled}
                      value={variant.stockQuantity}
                      onChange={(event) =>
                        updateVariant(variant.categorySizeId, {
                          stockQuantity: Number(event.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <AdminLabel>SKU</AdminLabel>
                    <AdminInput
                      disabled={disabled}
                      value={variant.sku}
                      onChange={(event) =>
                        updateVariant(variant.categorySizeId, { sku: event.target.value })
                      }
                    />
                  </div>
                  {showFurnitureFields && (
                    <div>
                      <AdminLabel>Pieces in set</AdminLabel>
                      <AdminInput
                        type="number"
                        min="1"
                        disabled={disabled}
                        placeholder="e.g. 6"
                        value={readAttribute(variant, "pieces")}
                        onChange={(event) =>
                          updateVariantAttribute(variant.categorySizeId, "pieces", event.target.value)
                        }
                      />
                    </div>
                  )}
                  <div>
                    <AdminLabel>Weight</AdminLabel>
                    <AdminInput
                      disabled={disabled}
                      placeholder="e.g. 45 kg"
                      value={variant.weight ?? ""}
                      onChange={(event) =>
                        updateVariant(variant.categorySizeId, { weight: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <AdminLabel>Dimensions</AdminLabel>
                    <AdminInput
                      disabled={disabled}
                      placeholder={showFurnitureFields ? "e.g. 180 × 90 × 75 cm" : "Optional"}
                      value={variant.dimensions ?? ""}
                      onChange={(event) =>
                        updateVariant(variant.categorySizeId, { dimensions: event.target.value })
                      }
                    />
                  </div>
                  {showFurnitureFields && (
                    <>
                      <div>
                        <AdminLabel>Color</AdminLabel>
                        <AdminInput
                          disabled={disabled}
                          placeholder="e.g. Walnut, Grey"
                          value={variant.color ?? ""}
                          onChange={(event) =>
                            updateVariant(variant.categorySizeId, { color: event.target.value })
                          }
                        />
                      </div>
                      <div>
                        <AdminLabel>Material</AdminLabel>
                        <AdminInput
                          disabled={disabled}
                          placeholder="e.g. Solid wood, MDF"
                          value={readAttribute(variant, "material")}
                          onChange={(event) =>
                            updateVariantAttribute(variant.categorySizeId, "material", event.target.value)
                          }
                        />
                      </div>
                      <div>
                        <AdminLabel>Finish</AdminLabel>
                        <AdminInput
                          disabled={disabled}
                          placeholder="e.g. Matte, Gloss"
                          value={readAttribute(variant, "finish")}
                          onChange={(event) =>
                            updateVariantAttribute(variant.categorySizeId, "finish", event.target.value)
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
