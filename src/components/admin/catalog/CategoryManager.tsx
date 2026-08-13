"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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
  AdminBadge,
  AdminButton,
  AdminInput,
  AdminLabel,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/ui";
import { AdminCard, AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { saveCategoryAction, removeCategoryAction } from "@/server/catalog/admin-category-actions";
import { slugify } from "@/lib/slug";
import type {
  AdminCategoryChildRow,
  AdminCategoryFormValues,
  AdminCategoryRow,
  AdminCategoryStatus,
} from "@/types/admin-category";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]),
});

type FormValues = z.infer<typeof categorySchema>;

type CategoryManagerProps = {
  categories: AdminCategoryRow[];
};

function statusTone(status: AdminCategoryStatus) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "DRAFT") return "warning" as const;
  return "muted" as const;
}

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
  const isEdit = Boolean(category);

  const [heroImage, setHeroImage] = useState<AdminHeroImage>(null);

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

  if (!open) return null;

  function onSubmit(values: FormValues) {
    const payload: AdminCategoryFormValues = {
      name: values.name,
      slug: values.slug?.trim() || slugify(values.name),
      description: values.description,
      heroImage: heroImage?.url,
      heroImagePublicId: heroImage?.publicId?.trim() || null,
      parentId: values.parentId || null,
      sortOrder: values.sortOrder,
      status: values.status,
    };

    startTransition(async () => {
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-form-title"
        className="relative z-10 w-full max-w-lg rounded-xl border border-navy/10 bg-white p-6 shadow-xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
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

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              {...form.register("description")}
              placeholder="Optional short description"
            />
          </div>

          <ImageUploader value={heroImage} onChange={setHeroImage} />

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

          <div className="flex justify-end gap-2 border-t border-navy/10 pt-4">
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
        {category.productCount > 0 && " Categories with products will be archived."}
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
                if (result.error.includes("archived instead")) {
                  toast.success(result.error);
                  setConfirming(false);
                  onDeleted();
                  router.refresh();
                } else {
                  toast.error(result.error);
                }
                return;
              }
              toast.success("Category deleted");
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
                    <AdminBadge tone={statusTone(category.status)}>{category.status}</AdminBadge>
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
                          <AdminBadge tone={statusTone(child.status)}>{child.status}</AdminBadge>
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
