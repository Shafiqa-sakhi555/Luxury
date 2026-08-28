"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { AdminButton, AdminInput, AdminLabel, AdminSelect } from "@/components/admin/ui";
import {
  buildSizesFromPreset,
  CATEGORY_SIZE_PRESETS,
  type CategorySizePresetKey,
} from "@/lib/catalog/category-size-presets";
import type { CategoryVariantProfile } from "@/lib/catalog/category-variant-profiles";
import { cn } from "@/lib/utils";
import type { AdminCategorySizeInput } from "@/types/category-sizes";

type CategorySizeEditorProps = {
  value: AdminCategorySizeInput[];
  onChange: (sizes: AdminCategorySizeInput[]) => void;
  profile?: CategoryVariantProfile;
};

function reorderSizes(sizes: AdminCategorySizeInput[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= sizes.length) {
    return sizes;
  }

  const next = [...sizes];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next.map((size, index) => ({ ...size, sortOrder: index }));
}

export function CategorySizeEditor({ value, onChange, profile }: CategorySizeEditorProps) {
  const optionLabel = profile?.optionLabel ?? "Size";
  const optionLabelPlural = profile?.optionLabelPlural ?? "Sizes";
  const editableCustom = profile?.editableCustomLabels ?? false;
  const suggestedPresets = profile?.suggestedPresets;
  const presetEntries = Object.entries(CATEGORY_SIZE_PRESETS).sort(([keyA], [keyB]) => {
    const aSuggested = suggestedPresets?.includes(keyA as CategorySizePresetKey) ? 0 : 1;
    const bSuggested = suggestedPresets?.includes(keyB as CategorySizePresetKey) ? 0 : 1;
    return aSuggested - bSuggested || CATEGORY_SIZE_PRESETS[keyA as CategorySizePresetKey].label.localeCompare(
      CATEGORY_SIZE_PRESETS[keyB as CategorySizePresetKey].label
    );
  });

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  function commitReorder(fromIndex: number, toIndex: number) {
    onChange(reorderSizes(value, fromIndex, toIndex));
    setDragIndex(null);
    setDropIndex(null);
  }

  function updateSize(index: number, patch: Partial<AdminCategorySizeInput>) {
    onChange(value.map((size, i) => (i === index ? { ...size, ...patch } : size)));
  }

  function addSize(isCustom = false) {
    onChange([
      ...value,
      {
        label: isCustom
          ? profile?.showFurnitureFields
            ? "Custom configuration"
            : "Custom Size"
          : "",
        sortOrder: value.length,
        isActive: true,
        isCustom,
      },
    ]);
  }

  function removeSize(index: number) {
    onChange(value.filter((_, i) => i !== index).map((size, i) => ({ ...size, sortOrder: i })));
  }

  function moveSize(index: number, direction: -1 | 1) {
    commitReorder(index, index + direction);
  }

  function applyPreset(presetKey: CategorySizePresetKey) {
    const additions = buildSizesFromPreset(presetKey, value);
    if (additions.length === 0) return;
    onChange([
      ...value,
      ...additions.map((size, index) => ({
        ...size,
        sortOrder: value.length + index,
      })),
    ]);
  }

  return (
    <div className="space-y-3 rounded-lg border border-navy/10 bg-brand-50/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-navy">Available {optionLabelPlural.toLowerCase()}</h3>
          <p className="mt-0.5 text-xs text-muted">
            Pick a preset from the dropdown, or add {optionLabelPlural.toLowerCase()} manually. Drag rows or use
            arrows to reorder.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <AdminButton type="button" variant="outline" size="sm" onClick={() => addSize(false)}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add {optionLabel.toLowerCase()}
          </AdminButton>
          {!value.some((size) => size.isCustom) && (
            <AdminButton type="button" variant="outline" size="sm" onClick={() => addSize(true)}>
              Custom
            </AdminButton>
          )}
        </div>
      </div>

      <div>
        <AdminLabel htmlFor="size-preset">Quick add preset sizes</AdminLabel>
        <AdminSelect
          id="size-preset"
          defaultValue=""
          onChange={(event) => {
            const key = event.target.value as CategorySizePresetKey | "";
            if (!key) return;
            applyPreset(key);
            event.target.value = "";
          }}
        >
          <option value="">Choose a preset…</option>
          {presetEntries.map(([key, preset]) => (
            <option key={key} value={key}>
              {preset.label}
              {suggestedPresets?.includes(key as CategorySizePresetKey) ? " (recommended)" : ""}
            </option>
          ))}
        </AdminSelect>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-muted">
          No {optionLabelPlural.toLowerCase()} yet. Use the preset dropdown above, or click Add{" "}
          {optionLabel.toLowerCase()}.
        </p>
      ) : (
        <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {value.map((size, index) => {
            const isDragging = dragIndex === index;
            const isDropTarget = dropIndex === index && dragIndex !== null && dragIndex !== index;

            return (
              <li
                key={size.id ?? `new-${index}`}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDropIndex(null);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (dragIndex !== null && dragIndex !== index) {
                    setDropIndex(index);
                  }
                }}
                onDragLeave={() => {
                  if (dropIndex === index) setDropIndex(null);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (dragIndex !== null) commitReorder(dragIndex, index);
                }}
                className={cn(
                  "flex flex-wrap items-center gap-2 rounded-lg border bg-white p-3 transition",
                  isDragging && "border-navy/30 opacity-60",
                  isDropTarget && "border-navy bg-brand-50 ring-1 ring-navy/20",
                  !isDragging && !isDropTarget && "border-navy/10"
                )}
              >
                <button
                  type="button"
                  className="cursor-grab touch-none rounded p-1 text-muted hover:bg-navy/5 hover:text-navy active:cursor-grabbing"
                  aria-label={`Drag to reorder ${size.label || "size"}`}
                >
                  <GripVertical className="h-4 w-4" />
                </button>

                <div className="min-w-0 flex-1">
                  <AdminLabel className="sr-only">Size name</AdminLabel>
                  <AdminInput
                    value={size.label}
                    onChange={(event) => updateSize(index, { label: event.target.value })}
                    placeholder={
                      size.isCustom
                        ? profile?.showFurnitureFields
                          ? "Custom configuration"
                          : "Custom Size"
                        : profile?.showFurnitureFields
                          ? "e.g. 6-seater L-shape"
                          : "e.g. 4 × 6 ft"
                    }
                    disabled={size.isCustom && !editableCustom}
                  />
                </div>

                <label className="flex items-center gap-1.5 text-xs text-navy">
                  <input
                    type="checkbox"
                    checked={size.isActive}
                    onChange={(event) => updateSize(index, { isActive: event.target.checked })}
                    className="rounded border-navy/20"
                  />
                  Active
                </label>

                <div className="flex items-center gap-0.5">
                  <AdminButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => moveSize(index, -1)}
                    disabled={index === 0}
                    aria-label="Move up"
                    title="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </AdminButton>
                  <AdminButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => moveSize(index, 1)}
                    disabled={index === value.length - 1}
                    aria-label="Move down"
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </AdminButton>
                  <AdminButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSize(index)}
                    aria-label="Remove size"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4 text-red" />
                  </AdminButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
