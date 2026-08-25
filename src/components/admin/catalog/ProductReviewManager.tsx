"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "@/components/admin/media/ImageUploader";
import type { AdminHeroImage } from "@/types/media";
import {
  AdminButton,
  AdminInput,
  AdminLabel,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/ui";
import { AdminCard, AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { removeProductReviewAction, saveProductReviewAction } from "@/server/product-reviews/actions";
import { slugify } from "@/lib/slug";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type {
  AdminProductReviewFormValues,
  AdminProductReviewRow,
  ProductReviewProductOption,
} from "@/types/product-review";

const schema = z.object({
  productId: z.string().min(1, "Select a product"),
  reviewerName: z.string().min(1, "Name is required"),
  title: z.string(),
  body: z.string().min(1, "Review text is required"),
  rating: z.enum(["1", "2", "3", "4", "5"]),
  isVerified: z.enum(["true", "false"]),
  isPublished: z.enum(["true", "false"]),
});

type FormValues = z.infer<typeof schema>;

function ProductReviewFormModal({
  open,
  onClose,
  review,
  products,
}: {
  open: boolean;
  onClose: () => void;
  review: AdminProductReviewRow | null;
  products: ProductReviewProductOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDivElement>(null);
  const isEdit = Boolean(review);
  const [heroImage, setHeroImage] = useState<AdminHeroImage>(null);

  useFocusTrap(dialogRef, open, onClose);

  useEffect(() => {
    if (!open) return;
    setHeroImage(
      review?.imageUrl ? { url: review.imageUrl, publicId: review.imagePublicId ?? "" } : null
    );
  }, [open, review?.id, review?.imageUrl, review?.imagePublicId]);

  const defaultValues: FormValues = {
    productId: review?.productId ?? products[0]?.id ?? "",
    reviewerName: review?.reviewerName ?? "",
    title: review?.title ?? "",
    body: review?.body ?? "",
    rating: String(review?.rating ?? 5) as FormValues["rating"],
    isVerified: review?.isVerified ? "true" : "false",
    isPublished: review && !review.isPublished ? "false" : "true",
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    values: open ? defaultValues : undefined,
  });

  const watchName = form.watch("reviewerName");
  const bannerKey = `product-review-${slugify(watchName || "new") || "new"}`;

  if (!open) return null;

  function onSubmit(values: FormValues) {
    const payload: AdminProductReviewFormValues = {
      productId: values.productId,
      reviewerName: values.reviewerName,
      title: values.title,
      body: values.body,
      rating: Number(values.rating),
      imageUrl: heroImage?.url,
      imagePublicId: heroImage?.publicId || null,
      isVerified: values.isVerified === "true",
      isPublished: values.isPublished === "true",
    };

    startTransition(async () => {
      const result = await saveProductReviewAction({ id: review?.id, values: payload });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Product review updated." : "Product review added.");
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/40 p-4 sm:p-8">
      <div ref={dialogRef} className="w-full max-w-2xl rounded-xl border border-navy/10 bg-white shadow-xl">
        <div className="border-b border-navy/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-navy">
            {isEdit ? "Edit product review" : "Add product review"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Shown under Add to Cart on that product page.
          </p>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-5">
          <div>
            <AdminLabel htmlFor="product-review-product">Product</AdminLabel>
            <AdminSelect id="product-review-product" {...form.register("productId")}>
              {products.length === 0 ? <option value="">No products found</option> : null}
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </AdminSelect>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <AdminLabel htmlFor="product-review-name">Reviewer name</AdminLabel>
              <AdminInput id="product-review-name" placeholder="Talha" {...form.register("reviewerName")} />
            </div>
            <div>
              <AdminLabel htmlFor="product-review-title">Title</AdminLabel>
              <AdminInput
                id="product-review-title"
                placeholder="Amazing quality"
                {...form.register("title")}
              />
            </div>
          </div>

          <div>
            <AdminLabel htmlFor="product-review-body">Review</AdminLabel>
            <AdminTextarea
              id="product-review-body"
              placeholder="The fabric is soft and the colors are exactly as shown..."
              {...form.register("body")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <AdminLabel htmlFor="product-review-rating">Rating</AdminLabel>
              <AdminSelect id="product-review-rating" {...form.register("rating")}>
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </AdminSelect>
            </div>
            <div>
              <AdminLabel htmlFor="product-review-verified">Verified</AdminLabel>
              <AdminSelect id="product-review-verified" {...form.register("isVerified")}>
                <option value="false">No badge</option>
                <option value="true">Show Verified badge</option>
              </AdminSelect>
            </div>
            <div>
              <AdminLabel htmlFor="product-review-status">Status</AdminLabel>
              <AdminSelect id="product-review-status" {...form.register("isPublished")}>
                <option value="true">Published</option>
                <option value="false">Hidden</option>
              </AdminSelect>
            </div>
          </div>

          <ImageUploader
            label="Review photo"
            value={heroImage}
            onChange={setHeroImage}
            bannerKey={bannerKey}
          />

          <div className="flex justify-end gap-2 border-t border-navy/10 pt-4">
            <AdminButton type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add review"}
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ProductReviewManager({
  reviews,
  products,
}: {
  reviews: AdminProductReviewRow[];
  products: ProductReviewProductOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProductReviewRow | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <AdminPageHeader
        title="Product feedback"
        description="Reviews shown under Add to Cart / Buy It Now on each product page. Customers can also write their own."
        actions={
          <AdminButton
            type="button"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Add product review
          </AdminButton>
        }
      />

      <AdminCard className="overflow-hidden">
        {reviews.length === 0 ? (
          <p className="p-6 text-sm text-muted">
            No product reviews yet. Add one here, or customers can write one on a product page.
          </p>
        ) : (
          <ul className="divide-y divide-navy/10">
            {reviews.map((review) => (
              <li key={review.id} className="flex items-start gap-4 p-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-brand-50">
                  {review.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={review.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-navy/30">
                      <Star className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-navy">{review.reviewerName}</p>
                    <span className="text-xs text-muted">{review.productName}</span>
                    {review.isVerified ? <span className="text-xs text-navy">Verified</span> : null}
                    {!review.isPublished ? <span className="text-xs text-amber-700">Hidden</span> : null}
                  </div>
                  <p className="mt-0.5 flex items-center gap-0.5 text-xs text-red">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-red text-red" />
                    ))}
                  </p>
                  {review.title ? <p className="mt-1 text-sm font-medium text-navy">{review.title}</p> : null}
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{review.body}</p>
                </div>
                <div className="flex items-center gap-1">
                  <AdminButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(review);
                      setOpen(true);
                    }}
                    aria-label={`Edit ${review.reviewerName}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </AdminButton>
                  <AdminButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    aria-label={`Delete ${review.reviewerName}`}
                    onClick={() => {
                      if (!confirm(`Remove the review from ${review.reviewerName}?`)) return;
                      startTransition(async () => {
                        const result = await removeProductReviewAction({ id: review.id });
                        if (!result.ok) {
                          toast.error(result.error);
                          return;
                        }
                        toast.success("Review deleted.");
                        router.refresh();
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red" />
                  </AdminButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <ProductReviewFormModal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        review={editing}
        products={products}
      />
    </div>
  );
}
