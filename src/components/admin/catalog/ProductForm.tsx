"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AdminButton, AdminInput, AdminLabel, AdminSelect, AdminTextarea } from "@/components/admin/ui";
import { AdminCard } from "@/components/admin/layout/AdminPageHeader";
import { ProductImageUploader } from "@/components/admin/media/ProductImageUploader";
import { ProductSizeVariantEditor } from "@/components/admin/catalog/ProductSizeVariantEditor";
import { saveProductAction } from "@/server/catalog/admin-actions";
import { getCategorySizesAction } from "@/server/catalog/category-size-actions";
import { computeDiscountPercentage, salePriceMajorFromDiscount, usesSquareFootSellingUnit } from "@/lib/catalog/product-pricing";
import { getCategoryVariantProfile } from "@/lib/catalog/category-variant-profiles";
import { slugify } from "@/lib/slug";
import type { AdminCategoryOption, AdminProductDetail } from "@/types/admin-catalog";
import type { AdminProductImage } from "@/types/media";
import type { AdminCategorySize, AdminProductVariantInput } from "@/types/category-sizes";

type FormValues = {
  mainCategoryId: string;
  sectionId: string;
  colors: string;
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
  fabric?: string;
  design?: string;
};

const productSchema = z.object({
  mainCategoryId: z.string().min(1, "Select a category"),
  sectionId: z.string(),
  colors: z.string(),
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
});

type ProductFormProps = {
  categories: AdminCategoryOption[];
  product?: AdminProductDetail;
};

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<AdminProductImage[]>(product?.images ?? []);
  const imagesRef = useRef<AdminProductImage[]>(product?.images ?? []);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [discountPercentInput, setDiscountPercentInput] = useState(() => {
    const original = product?.originalPriceMajor ?? 0;
    const sale = product?.salePriceMajor ?? 0;
    if (original <= 0 || sale <= 0 || sale >= original) return "";
    return String(computeDiscountPercentage(Math.round(original * 100), Math.round(sale * 100)));
  });
  const [usePerSquareFootPricing, setUsePerSquareFootPricing] = useState(() =>
    usesSquareFootSellingUnit(product?.sellingUnit)
  );
  const [categorySizes, setCategorySizes] = useState<AdminCategorySize[]>([]);
  const [sizesEnabled, setSizesEnabled] = useState(false);
  const [sizeVariants, setSizeVariants] = useState<AdminProductVariantInput[]>(
    product?.variantDetails ?? []
  );
  const [loadingSizes, setLoadingSizes] = useState(false);
  const discountEditRef = useRef(false);
  const draftKeyRef = useRef(crypto.randomUUID());
  const isEdit = Boolean(product);

  const initialCategory = product
    ? { mainCategoryId: product.mainCategoryId, sectionId: product.sectionId }
    : { mainCategoryId: "", sectionId: "" };

  const defaultValues: FormValues = {
    mainCategoryId: initialCategory.mainCategoryId,
    sectionId: initialCategory.sectionId,
    colors: product?.colors ?? "",
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    shortDescription: product?.shortDescription ?? "",
    description: product?.description ?? "",
    sku: product?.sku ?? "",
    originalPriceMajor: product?.originalPriceMajor ?? 0,
    salePriceMajor: product?.salePriceMajor ?? 0,
    stockQuantity: product?.stockQuantity ?? 0,
    status: product?.status ?? "ACTIVE",
    isFeatured: product?.isFeatured ?? false,
    sellingUnit: product?.sellingUnit ?? "",
    fabric: product?.fabric ?? "",
    design: product?.design ?? "",
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  const watchName = form.watch("name");
  const watchMainCategoryId = form.watch("mainCategoryId");
  const watchSectionId = form.watch("sectionId");
  const watchOriginalPrice = form.watch("originalPriceMajor");
  const watchSalePrice = form.watch("salePriceMajor");

  const mainCategories = useMemo(
    () => categories.filter((category) => !category.parentId),
    [categories]
  );

  const sectionOptions = useMemo(
    () => categories.filter((category) => category.parentId === watchMainCategoryId),
    [categories, watchMainCategoryId]
  );

  const priceDiscountPercent = useMemo(() => {
    const original = Number(watchOriginalPrice) || 0;
    const sale = Number(watchSalePrice) || 0;
    if (original <= 0 || sale <= 0 || sale >= original) return 0;
    return computeDiscountPercentage(Math.round(original * 100), Math.round(sale * 100));
  }, [watchOriginalPrice, watchSalePrice]);

  useEffect(() => {
    if (!usePerSquareFootPricing) return;

    if (discountEditRef.current) {
      discountEditRef.current = false;
      return;
    }

    const original = Number(watchOriginalPrice) || 0;
    const sale = Number(watchSalePrice) || 0;
    if (original <= 0 || sale <= 0 || sale >= original) {
      setDiscountPercentInput("");
      return;
    }

    setDiscountPercentInput(
      String(computeDiscountPercentage(Math.round(original * 100), Math.round(sale * 100)))
    );
  }, [watchOriginalPrice, watchSalePrice, usePerSquareFootPricing]);

  function togglePerSquareFootPricing(enabled: boolean) {
    setUsePerSquareFootPricing(enabled);
    if (enabled) {
      form.setValue("sellingUnit", "per sq ft", { shouldDirty: true });
      return;
    }

    if (form.getValues("sellingUnit")?.trim().toLowerCase() === "per sq ft") {
      form.setValue("sellingUnit", "", { shouldDirty: true });
    }
    setDiscountPercentInput("");
  }

  function applyDiscountPercent(rawValue: string) {
    setDiscountPercentInput(rawValue);
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return;

    const original = Number(form.getValues("originalPriceMajor")) || 0;
    if (original <= 0) return;

    discountEditRef.current = true;
    const sale =
      parsed <= 0 ? original : salePriceMajorFromDiscount(original, parsed);
    form.setValue("salePriceMajor", sale, { shouldDirty: true, shouldValidate: true });
  }

  function handleRegularRateChange(event: React.ChangeEvent<HTMLInputElement>) {
    const original = Number(event.target.value) || 0;
    form.setValue("originalPriceMajor", original, { shouldDirty: true, shouldValidate: true });

    const parsedDiscount = Number(discountPercentInput);
    if (usePerSquareFootPricing && original > 0 && Number.isFinite(parsedDiscount) && parsedDiscount > 0) {
      discountEditRef.current = true;
      form.setValue(
        "salePriceMajor",
        salePriceMajorFromDiscount(original, parsedDiscount),
        { shouldDirty: true, shouldValidate: true }
      );
    }
  }

  useEffect(() => {
    if (!watchSectionId) return;
    const sectionStillValid = sectionOptions.some((section) => section.id === watchSectionId);
    if (!sectionStillValid) {
      form.setValue("sectionId", "");
    }
  }, [form, sectionOptions, watchSectionId]);

  const resolvedCategoryId = watchSectionId || watchMainCategoryId || product?.categoryId || "";
  const selectedCategory =
    categories.find((category) => category.id === resolvedCategoryId) ??
    categories.find((category) => category.id === watchMainCategoryId);
  const categorySlug = selectedCategory?.slug ?? product?.categorySlug ?? null;
  const categoryId = resolvedCategoryId || null;
  const variantProfile = getCategoryVariantProfile(categorySlug, selectedCategory?.name);
  const usesCategorySizes = sizesEnabled && categorySizes.length > 0;
  const isLegacyImportProduct = Boolean(product?.hasVariants && !product?.usesCategorySizes);
  const showSizeVariants = usesCategorySizes && !isLegacyImportProduct;

  useEffect(() => {
    if (!categoryId) {
      setCategorySizes([]);
      setSizesEnabled(false);
      return;
    }

    let cancelled = false;
    setLoadingSizes(true);
    void getCategorySizesAction(categoryId).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setSizesEnabled(result.sizesEnabled);
        setCategorySizes(result.sizes.filter((size) => size.isActive));
      } else {
        setSizesEnabled(false);
        setCategorySizes([]);
      }
      setLoadingSizes(false);
    });

    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  useEffect(() => {
    if (product?.variantDetails?.length && usesCategorySizes) {
      setSizeVariants(product.variantDetails);
    }
  }, [product?.id, product?.variantDetails, usesCategorySizes]);

  function handleImagesChange(nextImages: AdminProductImage[]) {
    imagesRef.current = nextImages;
    setImages(nextImages);
  }

  const onSubmit = form.handleSubmit((values) => {
    setError(null);

    const currentImages = imagesRef.current;
    if (uploadingImages) {
      setError("Wait for image uploads to finish before saving.");
      return;
    }

    if (showSizeVariants && sizeVariants.length === 0) {
      setError(`Select at least one ${variantProfile.optionLabel.toLowerCase()} for this product.`);
      return;
    }

    const categoryIdToSave = values.sectionId || values.mainCategoryId;
    if (!categoryIdToSave) {
      setError("Select a category.");
      return;
    }

    startTransition(async () => {
      const slug = values.slug?.trim() || slugify(values.name);
      const result = await saveProductAction({
        id: product?.id,
        values: {
          categoryId: categoryIdToSave,
          colors: values.colors?.trim() ?? "",
          name: values.name,
          slug,
          shortDescription: values.shortDescription ?? "",
          description: values.description ?? "",
          sku: values.sku ?? "",
          originalPriceMajor: values.originalPriceMajor,
          salePriceMajor: values.salePriceMajor,
          stockQuantity: values.stockQuantity,
          status: values.status,
          isFeatured: values.isFeatured,
          sellingUnit: usePerSquareFootPricing ? "per sq ft" : values.sellingUnit ?? "",
          pricePerSquareFoot: usePerSquareFootPricing,
          fabric: values.fabric ?? "",
          design: values.design ?? "",
          variants: showSizeVariants ? sizeVariants : undefined,
          images: currentImages,
          draftKey: draftKeyRef.current,
        },
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      toast.success(isEdit ? "Product updated" : "Product created");
      router.push("/admin/catalog/products");
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

      {categories.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No categories found. Create at least one category under{" "}
          <a href="/admin/catalog/categories" className="font-medium underline">
            Admin → Categories
          </a>{" "}
          before adding products.
        </div>
      )}

      {isLegacyImportProduct && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This product has imported color/design variants (e.g. carpet collections). You can update
          the collection name, description, images, and base pricing here. Individual variant SKUs are
          managed by the catalog import.
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
            <ProductImageUploader
              value={images}
              onChange={handleImagesChange}
              onUploadingChange={setUploadingImages}
              altFallback={watchName || "Product image"}
              categorySlug={categorySlug}
              categoryId={categoryId}
              productId={product?.id}
              draftKey={draftKeyRef.current}
            />
          </AdminCard>
        </div>

        <div className="space-y-4">
          <AdminCard className="space-y-4 p-5">
            <h2 className="text-sm font-semibold text-navy">Classification</h2>

            <div>
              <AdminLabel htmlFor="mainCategoryId">Category</AdminLabel>
              <AdminSelect id="mainCategoryId" {...form.register("mainCategoryId")}>
                <option value="">Select category</option>
                {mainCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </AdminSelect>
              {form.formState.errors.mainCategoryId && (
                <p className="mt-1 text-xs text-red">{form.formState.errors.mainCategoryId.message}</p>
              )}
            </div>

            <div>
              <AdminLabel htmlFor="sectionId">Section</AdminLabel>
              <AdminSelect
                id="sectionId"
                {...form.register("sectionId")}
                disabled={!watchMainCategoryId || sectionOptions.length === 0}
              >
                <option value="">
                  {!watchMainCategoryId
                    ? "Select a category first"
                    : sectionOptions.length === 0
                      ? "No sections for this category"
                      : "None (use main category)"}
                </option>
                {sectionOptions.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </AdminSelect>
              <p className="mt-1 text-xs text-muted">
                Optional subcategory — create sections under Admin → Categories.
              </p>
            </div>

            <div>
              <AdminLabel htmlFor="colors">Colors</AdminLabel>
              <AdminInput
                id="colors"
                {...form.register("colors")}
                placeholder="e.g. Grey, Blue, Cream, White"
              />
              <p className="mt-1 text-xs text-muted">
                Comma-separated list. Used as the default variant color where applicable.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <AdminLabel htmlFor="fabric">
                  {variantProfile.showFurnitureFields ? "Material (default)" : "Material / fabric"}
                </AdminLabel>
                <AdminInput
                  id="fabric"
                  {...form.register("fabric")}
                  placeholder={variantProfile.showFurnitureFields ? "e.g. Solid wood" : "e.g. Wool, Cotton"}
                />
              </div>
              <div>
                <AdminLabel htmlFor="design">
                  {variantProfile.showFurnitureFields ? "Style / finish" : "Design"}
                </AdminLabel>
                <AdminInput
                  id="design"
                  {...form.register("design")}
                  placeholder={
                    variantProfile.showFurnitureFields ? "e.g. Modern, Scandinavian" : "e.g. Persian Floral"
                  }
                />
              </div>
            </div>
          </AdminCard>

          {showSizeVariants && (
            <AdminCard className="space-y-4 p-5">
              <h2 className="text-sm font-semibold text-navy">
                {variantProfile.optionLabel} &amp; pricing
              </h2>
              {loadingSizes ? (
                <p className="text-sm text-muted">Loading category {variantProfile.optionLabelPlural.toLowerCase()}...</p>
              ) : (
                <ProductSizeVariantEditor
                  categorySizes={categorySizes}
                  variants={sizeVariants}
                  onChange={setSizeVariants}
                  productSlug={form.watch("slug") || slugify(watchName || "product")}
                  profile={variantProfile}
                />
              )}
            </AdminCard>
          )}

          {!showSizeVariants && (
          <AdminCard className="space-y-4 p-5">
            <h2 className="text-sm font-semibold text-navy">Pricing & inventory</h2>

            <div>
              <AdminLabel htmlFor="sku">SKU</AdminLabel>
              <AdminInput id="sku" {...form.register("sku")} placeholder="Optional" />
            </div>

            <label className="flex items-start gap-2 rounded-lg border border-navy/10 bg-brand-50 px-3 py-3 text-sm text-navy">
              <input
                type="checkbox"
                className="mt-0.5 rounded border-navy/20"
                checked={usePerSquareFootPricing}
                onChange={(event) => togglePerSquareFootPricing(event.target.checked)}
              />
              <span>
                <span className="font-medium">Price per square foot</span>
                <span className="mt-1 block text-xs text-muted">
                  Optional — turn on when the product is priced by room size. Leave off for fixed prices
                  (curtains, prayer mats, pillows, etc.).
                </span>
              </span>
            </label>

            {usePerSquareFootPricing ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <AdminLabel htmlFor="sqftRate">Rate per sq ft (Rs)</AdminLabel>
                    <AdminInput
                      id="sqftRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={Number.isFinite(watchOriginalPrice) ? watchOriginalPrice : ""}
                      onChange={handleRegularRateChange}
                    />
                  </div>
                  <div>
                    <AdminLabel htmlFor="discountPercent">Discount (%)</AdminLabel>
                    <AdminInput
                      id="discountPercent"
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={discountPercentInput}
                      onChange={(event) => applyDiscountPercent(event.target.value)}
                    />
                  </div>
                  <div>
                    <AdminLabel htmlFor="sqftSaleRate">Sale rate per sq ft (Rs)</AdminLabel>
                    <AdminInput
                      id="sqftSaleRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={Number.isFinite(watchSalePrice) ? watchSalePrice : ""}
                      onChange={(event) =>
                        form.setValue("salePriceMajor", Number(event.target.value) || 0, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                  </div>
                </div>

                {priceDiscountPercent > 0 ? (
                  <div className="rounded-lg border border-red/20 bg-red/5 px-3 py-2 text-sm text-navy">
                    <span className="font-medium text-red">Save {priceDiscountPercent}%</span>
                    <span>
                      {" "}
                      on the per sq ft rate
                      {watchOriginalPrice > 0 && watchSalePrice > 0 ? (
                        <> (Rs {watchOriginalPrice} → Rs {watchSalePrice} / sq ft)</>
                      ) : null}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-muted">
                    Set a discount % or enter a sale rate lower than the regular sq ft rate.
                  </p>
                )}
              </>
            ) : (
              <>
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

                {priceDiscountPercent > 0 ? (
                  <div className="rounded-lg border border-red/20 bg-red/5 px-3 py-2 text-sm text-navy">
                    <span className="font-medium text-red">Save {priceDiscountPercent}%</span>
                    <span> on the sale price</span>
                  </div>
                ) : null}

                <div>
                  <AdminLabel htmlFor="sellingUnit">Selling unit</AdminLabel>
                  <AdminInput
                    id="sellingUnit"
                    {...form.register("sellingUnit")}
                    placeholder="e.g. per pair, per piece, sold individually"
                  />
                </div>
              </>
            )}

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
          )}

          {showSizeVariants && (
            <AdminCard className="space-y-4 p-5">
              <h2 className="text-sm font-semibold text-navy">Status</h2>
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
          )}

          <div className="flex flex-col gap-2">
            <AdminButton type="submit" disabled={pending || uploadingImages}>
              {pending ? "Saving..." : uploadingImages ? "Uploading images..." : isEdit ? "Save changes" : "Create product"}
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
