"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminButton, AdminInput, AdminLabel, AdminSelect, AdminTextarea } from "@/components/admin/ui";
import { AdminCard } from "@/components/admin/layout/AdminPageHeader";
import { saveProductAction } from "@/server/catalog/admin-actions";
import { slugify } from "@/lib/slug";
import type { AdminCategoryOption, AdminProductDetail } from "@/types/admin-catalog";

type FormValues = {
  categoryId: string;
  name: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  sku?: string;
  originalPriceMajor: number;
  salePriceMajor: number;
  stockQuantity: number;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  isFeatured: boolean;
  sellingUnit?: string;
  imageUrls?: string;
};

const productSchema = z.object({
  categoryId: z.string().min(1, "Select a category"),
  name: z.string().min(2, "Name is required"),
  slug: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  originalPriceMajor: z.number().min(0),
  salePriceMajor: z.number().min(0),
  stockQuantity: z.number().int().min(0),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]),
  isFeatured: z.boolean(),
  sellingUnit: z.string().optional(),
  imageUrls: z.string().optional(),
});

type ProductFormProps = {
  categories: AdminCategoryOption[];
  product?: AdminProductDetail;
};

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(product);

  const defaultValues: FormValues = {
    categoryId: product?.categoryId ?? "",
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    shortDescription: product?.shortDescription ?? "",
    description: product?.description ?? "",
    sku: product?.sku ?? "",
    originalPriceMajor: product?.originalPriceMajor ?? 0,
    salePriceMajor: product?.salePriceMajor ?? 0,
    stockQuantity: product?.stockQuantity ?? 0,
    status: product?.status ?? "DRAFT",
    isFeatured: product?.isFeatured ?? false,
    sellingUnit: product?.sellingUnit ?? "",
    imageUrls: product?.imageUrls ?? "",
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  const watchName = form.watch("name");

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const slug = values.slug?.trim() || slugify(values.name);
      const result = await saveProductAction({
        id: product?.id,
        values: {
          ...values,
          slug,
          shortDescription: values.shortDescription ?? "",
          description: values.description ?? "",
          sku: values.sku ?? "",
          sellingUnit: values.sellingUnit ?? "",
          imageUrls: values.imageUrls ?? "",
        },
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push(`/admin/catalog/products/${result.id}`);
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red/20 bg-red/5 px-4 py-3 text-sm text-red">
          {error}
        </div>
      )}

      {product?.hasVariants && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This product has multiple color/design variants. You can update the collection name,
          description, images, and base pricing here. Individual variant SKUs are managed by the
          catalog import.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <AdminCard className="space-y-4 p-5">
            <h2 className="text-sm font-semibold text-navy">Product details</h2>

            <div>
              <AdminLabel htmlFor="name">Product name</AdminLabel>
              <AdminInput id="name" {...form.register("name")} placeholder="e.g. Nagar Rustic Wall-to-Wall Carpet" />
              {form.formState.errors.name && (
                <p className="mt-1 text-xs text-red">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <AdminLabel htmlFor="slug">URL slug</AdminLabel>
              <AdminInput
                id="slug"
                {...form.register("slug")}
                placeholder={slugify(watchName || "product-name")}
              />
            </div>

            <div>
              <AdminLabel htmlFor="shortDescription">Short description</AdminLabel>
              <AdminTextarea id="shortDescription" rows={2} {...form.register("shortDescription")} />
            </div>

            <div>
              <AdminLabel htmlFor="description">Full description</AdminLabel>
              <AdminTextarea id="description" rows={8} {...form.register("description")} />
            </div>
          </AdminCard>

          <AdminCard className="space-y-4 p-5">
            <h2 className="text-sm font-semibold text-navy">Images</h2>
            <p className="text-xs text-muted">
              Paste one image URL per line. Use Supabase public URLs or paths like
              /images/category/carpets/nagar/photo.jpg
            </p>
            <AdminTextarea id="imageUrls" rows={6} {...form.register("imageUrls")} />
          </AdminCard>
        </div>

        <div className="space-y-4">
          <AdminCard className="space-y-4 p-5">
            <h2 className="text-sm font-semibold text-navy">Pricing & inventory</h2>

            <div>
              <AdminLabel htmlFor="categoryId">Category</AdminLabel>
              <AdminSelect id="categoryId" {...form.register("categoryId")}>
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </AdminSelect>
            </div>

            <div>
              <AdminLabel htmlFor="sku">SKU</AdminLabel>
              <AdminInput id="sku" {...form.register("sku")} placeholder="Optional" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <AdminLabel htmlFor="originalPriceMajor">Regular price (Rs)</AdminLabel>
                <AdminInput
                  id="originalPriceMajor"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register("originalPriceMajor", { valueAsNumber: true })}
                />
              </div>
              <div>
                <AdminLabel htmlFor="salePriceMajor">Sale price (Rs)</AdminLabel>
                <AdminInput
                  id="salePriceMajor"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register("salePriceMajor", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div>
              <AdminLabel htmlFor="sellingUnit">Selling unit</AdminLabel>
              <AdminInput
                id="sellingUnit"
                {...form.register("sellingUnit")}
                placeholder="e.g. per sq ft"
              />
            </div>

            <div>
              <AdminLabel htmlFor="stockQuantity">Stock quantity</AdminLabel>
              <AdminInput
                id="stockQuantity"
                type="number"
                min="0"
                {...form.register("stockQuantity", { valueAsNumber: true })}
              />
            </div>

            <div>
              <AdminLabel htmlFor="status">Status</AdminLabel>
              <AdminSelect id="status" {...form.register("status")}>
                <option value="ACTIVE">Active (visible on storefront)</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived / hidden</option>
              </AdminSelect>
            </div>

            <label className="flex items-center gap-2 text-sm text-navy">
              <input type="checkbox" {...form.register("isFeatured")} className="rounded border-navy/20" />
              Featured product
            </label>
          </AdminCard>

          <div className="flex flex-col gap-2">
            <AdminButton type="submit" disabled={pending}>
              {pending ? "Saving..." : isEdit ? "Save changes" : "Create product"}
            </AdminButton>
            <AdminButton
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/catalog/products")}
            >
              Cancel
            </AdminButton>
          </div>
        </div>
      </div>
    </form>
  );
}
