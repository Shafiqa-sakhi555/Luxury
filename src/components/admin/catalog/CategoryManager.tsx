"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "@/components/admin/media/ImageUploader";
import type { AdminHeroImage } from "@/types/media";
import {
  AdminButton,
  AdminInput,
  AdminLabel,
  AdminSelect,
  AdminTextarea,
  ProductStatusBadge,
} from "@/components/admin/ui";
import { AdminCard, AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { saveCategoryAction, removeCategoryAction } from "@/server/catalog/admin-category-actions";
import { getCategorySizesAction } from "@/server/catalog/category-size-actions";
import { CategorySizeEditor } from "@/components/admin/catalog/CategorySizeEditor";
import { getCategoryVariantProfile } from "@/lib/catalog/category-variant-profiles";
import { slugify } from "@/lib/slug";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type {
  AdminCategoryChildRow,
  AdminCategoryFormValues,
  AdminCategoryRow,
} from "@/types/admin-category";
import type { AdminCategorySizeInput } from "@/types/category-sizes";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]),
});

type FormValues = z.infer<typeof categorySchema>;

function cleanSizesForSave(sizes: AdminCategorySizeInput[]): AdminCategorySizeInput[] {
  return sizes
    .filter((size) => size.label.trim().length > 0)
    .map((size, index) => ({
      ...size,
      label: size.label.trim(),
      sortOrder: index,
    }));
}

type CategoryManagerProps = {
  categories: AdminCategoryRow[];
};

function CategoryFormModal({
  open,
  onClose,
  category,
  parentOptions,
}: {
  open: boolean;
  onClose: () => void;
  category: AdminCategoryRow | AdminCategoryChildRow | null;
  parentOptions: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDivElement>(null);
  const isEdit = Boolean(category);

  useFocusTrap(dialogRef, open, onClose);

  const [heroImage, setHeroImage] = useState<AdminHeroImage>(null);
  const [sizes, setSizes] = useState<AdminCategorySizeInput[]>([]);
  const [sizesEnabled, setSizesEnabled] = useState(false);

  useEffect(() => {
    if (!open) return;
    setHeroImage(
      category?.heroImage
        ? {
            url: category.heroImage,
            publicId: category.heroImagePublicId ?? "",
          }
        : null
    );
    setSizes([]);
    setSizesEnabled(false);

    if (category?.id) {
      void getCategorySizesAction(category.id)
        .then((result) => {
          if (!result.ok) {
            toast.error(result.error ?? "Could not load category sizes.");
            return;
          }
          if (result.migrationHint) {
            toast.warning("Size options need a database migration. Category can still be saved without sizes.");
          }
          setSizes(
            result.sizes.map((size, index) => ({
              id: size.id,
              label: size.label,
              sortOrder: size.sortOrder ?? index,
              isActive: size.isActive,
              isCustom: size.isCustom,
            }))
          );
          setSizesEnabled(result.sizesEnabled);
        })
        .catch(() => {
          toast.error("Could not load category sizes. Check your connection and try again.");
        });
    }
  }, [open, category?.id, category?.heroImage, category?.heroImagePublicId]);

  const defaultValues: FormValues = {
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
    parentId: category?.parentId ?? "",
    sortOrder: category?.sortOrder ?? 0,
    status: category?.status ?? "ACTIVE",
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues,
    values: open ? defaultValues : undefined,
  });

  const watchName = form.watch("name");
  const watchSlug = form.watch("slug");
  const categorySlug = (watchSlug?.trim() || slugify(watchName || "category")).trim();
  const variantProfile = getCategoryVariantProfile(categorySlug, watchName);

  if (!open) return null;

  function onSubmit(values: FormValues) {
    const cleanedSizes = cleanSizesForSave(sizes);

    if (sizesEnabled && cleanedSizes.length === 0) {
      toast.error(
        `Add at least one ${variantProfile.optionLabel.toLowerCase()} with a name, or turn off Enable ${variantProfile.optionLabelPlural.toLowerCase()}.`
      );
      return;
    }

    const payload: AdminCategoryFormValues = {
      name: values.name,
      slug: values.slug?.trim() || slugify(values.name),
      description: values.description,
      heroImage: heroImage?.url,
      heroImagePublicId: heroImage?.publicId?.trim() || null,
      parentId: values.parentId || null,
      sortOrder: values.sortOrder,
      status: values.status,
      sizes: sizesEnabled ? cleanedSizes : undefined,
      sizesEnabled,
    };

    startTransition(async () => {
      try {
        const result = await saveCategoryAction({
          id: category?.id,
          values: payload,
        });

        if (!result.ok) {
          toast.error(result.error);
          return;
        }

        toast.success(isEdit ? "Category updated" : "Category created");
        onClose();
        router.refresh();
      } catch {
        toast.error("Could not save category. Check your connection and try again.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-navy/40"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-form-title"
        className="relative z-10 flex max-h-[min(92vh,880px)] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-navy/10 bg-white shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-navy/10 px-6 py-5">
          <div>
            <h2 id="category-form-title" className="text-lg font-semibold text-navy">
              {isEdit ? "Edit category" : "New category"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {isEdit ? "Update details and save changes." : "Add a category to your catalog tree."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-navy/5 hover:text-navy"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          id="category-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div>
            <AdminLabel htmlFor="category-name">Name</AdminLabel>
            <AdminInput id="category-name" {...form.register("name")} placeholder="Carpets" />
            {form.formState.errors.name && (
              <p className="mt-1 text-xs text-red">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <AdminLabel htmlFor="category-slug">Slug</AdminLabel>
            <AdminInput
              id="category-slug"
              {...form.register("slug")}
              placeholder="auto-generated from name"
            />
          </div>

          <div>
            <AdminLabel htmlFor="category-description">Description</AdminLabel>
            <AdminTextarea
              id="category-description"
              rows={3}
              {...form.register("description")}
              placeholder="Optional short description"
            />
          </div>

          <ImageUploader value={heroImage} onChange={setHeroImage} categorySlug={categorySlug} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <AdminLabel htmlFor="category-parent">Parent category</AdminLabel>
              <AdminSelect id="category-parent" {...form.register("parentId")} defaultValue="">
                <option value="">None (top level)</option>
                {parentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </AdminSelect>
            </div>

            <div>
              <AdminLabel htmlFor="category-sort">Sort order</AdminLabel>
              <AdminInput
                id="category-sort"
                type="number"
                min={0}
                {...form.register("sortOrder", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div>
            <AdminLabel htmlFor="category-status">Status</AdminLabel>
            <AdminSelect id="category-status" {...form.register("status")}>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </AdminSelect>
          </div>

          <label className="flex items-start gap-2 rounded-lg border border-navy/10 bg-brand-50 px-3 py-3 text-sm text-navy">
            <input
              type="checkbox"
              className="mt-0.5 rounded border-navy/20"
              checked={sizesEnabled}
              onChange={(event) => setSizesEnabled(event.target.checked)}
            />
            <span>
              <span className="font-medium">
                Enable {variantProfile.optionLabelPlural.toLowerCase()}
              </span>
              <span className="mt-1 block text-xs text-muted">
                Optional — turn on for categories where customers pick a size or configuration (rugs,
                blankets, tables, dining sets, furniture). Each option can have its own price, stock,
                and details on the product form.
              </span>
            </span>
          </label>

          {sizesEnabled ? (
            <CategorySizeEditor value={sizes} onChange={setSizes} profile={variantProfile} />
          ) : null}
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-navy/10 bg-white px-6 py-4">
            <AdminButton type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" disabled={pending}>
              {pending ? "Saving..." : isEdit ? "Save changes" : "Create category"}
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteCategoryButton({
  category,
  onDeleted,
}: {
  category: AdminCategoryRow | AdminCategoryChildRow;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <AdminButton
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${category.name}`}
      >
        <Trash2 className="h-4 w-4 text-red" />
      </AdminButton>
    );
  }

  return (
    <div className="rounded-lg border border-red/20 bg-red/5 p-3">
      <p className="text-xs text-navy">
        Delete <span className="font-medium">{category.name}</span>?
        {category.productCount > 0
          ? " This category has products and will be archived instead of deleted."
          : " Empty categories are permanently deleted."}
      </p>
      <div className="mt-2 flex gap-2">
        <AdminButton
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await removeCategoryAction({ id: category.id });
              if (!result.ok) {
                toast.error(result.error);
                return;
              }
              toast.success(
                result.archived
                  ? result.message ?? "Category archived"
                  : "Category deleted"
              );
              setConfirming(false);
              onDeleted();
              router.refresh();
            });
          }}
        >
          {pending ? "Removing..." : "Confirm"}
        </AdminButton>
        <AdminButton type="button" variant="outline" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </AdminButton>
      </div>
    </div>
  );
}

function CategoryRowActions({
  category,
  onEdit,
}: {
  category: AdminCategoryRow | AdminCategoryChildRow;
  onEdit: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-1">
      <AdminButton type="button" variant="ghost" size="sm" onClick={onEdit} aria-label={`Edit ${category.name}`}>
        <Pencil className="h-4 w-4" />
      </AdminButton>
      <DeleteCategoryButton category={category} onDeleted={() => router.refresh()} />
    </div>
  );
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    AdminCategoryRow | AdminCategoryChildRow | null
  >(null);

  const parentOptions = useMemo(
    () =>
      categories
        .filter((category) => category.id !== editingCategory?.id)
        .map((category) => ({ id: category.id, name: category.name })),
    [categories, editingCategory?.id]
  );

  const totalCount = useMemo(() => {
    return categories.reduce((sum, category) => sum + 1 + category.children.length, 0);
  }, [categories]);

  function openCreate() {
    setEditingCategory(null);
    setModalOpen(true);
  }

  function openEdit(category: AdminCategoryRow | AdminCategoryChildRow) {
    setEditingCategory(category);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingCategory(null);
  }

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description={`${totalCount}-category tree with parent/child hierarchy`}
        actions={
          <AdminButton type="button" onClick={openCreate}>
            New category
          </AdminButton>
        }
      />

      <AdminCard className="divide-y divide-navy/5">
        {categories.length === 0 ? (
          <p className="p-6 text-sm text-muted">No categories yet. Create one to get started.</p>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-navy">{category.name}</p>
                    <ProductStatusBadge status={category.status} />
                  </div>
                  <p className="text-xs text-muted">
                    /{category.slug} · {category.productCount} products · sort {category.sortOrder}
                  </p>
                  {category.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{category.description}</p>
                  )}
                </div>
                <CategoryRowActions category={category} onEdit={() => openEdit(category)} />
              </div>

              {category.children.length > 0 && (
                <div className="mt-3 ml-4 space-y-3 border-l border-navy/10 pl-4">
                  {category.children.map((child) => (
                    <div key={child.id} className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-navy">{child.name}</span>
                          <ProductStatusBadge status={child.status} />
                        </div>
                        <p className="text-xs text-muted">
                          /{child.slug} · {child.productCount} products · sort {child.sortOrder}
                        </p>
                      </div>
                      <CategoryRowActions category={child} onEdit={() => openEdit(child)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </AdminCard>

      <p className="mt-4 text-sm text-muted">
        <Link href="/admin/catalog/products" className="text-navy hover:underline">
          Back to products
        </Link>
      </p>

      <CategoryFormModal
        open={modalOpen}
        onClose={closeModal}
        category={editingCategory}
        parentOptions={parentOptions}
      />
    </div>
  );
}
