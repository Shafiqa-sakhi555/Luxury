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
import { removeReviewAction, saveReviewAction } from "@/server/reviews/actions";
import { slugify } from "@/lib/slug";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { AdminReviewFormValues, AdminReviewRow } from "@/types/admin-review";

const schema = z.object({
  reviewerName: z.string().min(1, "Name is required"),
  reviewerLocation: z.string().min(1, "Location is required"),
  quote: z.string().min(1, "Review text is required"),
  rating: z.enum(["1", "2", "3", "4", "5"]),
  sortOrder: z.number().int().min(0),
  isActive: z.enum(["true", "false"]),
});

type FormValues = z.infer<typeof schema>;

function ReviewFormModal({
  open,
  onClose,
  review,
  nextSortOrder,
}: {
  open: boolean;
  onClose: () => void;
  review: AdminReviewRow | null;
  nextSortOrder: number;
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
    reviewerName: review?.reviewerName ?? "",
    reviewerLocation: review?.reviewerLocation ?? "",
    quote: review?.quote ?? "",
    rating: String(review?.rating ?? 5) as FormValues["rating"],
    sortOrder: review?.sortOrder ?? nextSortOrder,
    isActive: review && !review.isActive ? "false" : "true",
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    values: open ? defaultValues : undefined,
  });

  const watchName = form.watch("reviewerName");
  const bannerKey = `review-${slugify(watchName || "new") || "new"}`;

  if (!open) return null;

  function onSubmit(values: FormValues) {
    const payload: AdminReviewFormValues = {
      reviewerName: values.reviewerName,
      reviewerLocation: values.reviewerLocation,
      quote: values.quote,
      rating: Number(values.rating),
      imageUrl: heroImage?.url,
      imagePublicId: heroImage?.publicId || null,
      sortOrder: values.sortOrder,
      isActive: values.isActive === "true",
    };

    startTransition(async () => {
      const result = await saveReviewAction({ id: review?.id, values: payload });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Review updated." : "Review added.");
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/40 p-4 sm:p-8">
      <div ref={dialogRef} className="w-full max-w-2xl rounded-xl border border-navy/10 bg-white shadow-xl">
        <div className="border-b border-navy/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-navy">{isEdit ? "Edit review" : "Add review"}</h2>
          <p className="mt-1 text-sm text-muted">
            Homepage card: quote, name, location, photo, and star rating.
          </p>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <AdminLabel htmlFor="review-name">Reviewer name</AdminLabel>
              <AdminInput id="review-name" placeholder="Fatima Khan" {...form.register("reviewerName")} />
            </div>
            <div>
              <AdminLabel htmlFor="review-location">Location</AdminLabel>
              <AdminInput id="review-location" placeholder="Gilgit City" {...form.register("reviewerLocation")} />
            </div>
          </div>

          <div>
            <AdminLabel htmlFor="review-quote">Review</AdminLabel>
            <AdminTextarea
              id="review-quote"
              placeholder="The Hunza Heritage Carpet transformed our living room..."
              {...form.register("quote")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <AdminLabel htmlFor="review-rating">Rating</AdminLabel>
              <AdminSelect id="review-rating" {...form.register("rating")}>
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </AdminSelect>
            </div>
            <div>
              <AdminLabel htmlFor="review-sort">Sort order</AdminLabel>
              <AdminInput
                id="review-sort"
                type="number"
                min={0}
                {...form.register("sortOrder", { valueAsNumber: true })}
              />
            </div>
            <div>
              <AdminLabel htmlFor="review-status">Status</AdminLabel>
              <AdminSelect id="review-status" {...form.register("isActive")}>
                <option value="true">Active — shown on homepage</option>
                <option value="false">Hidden</option>
              </AdminSelect>
            </div>
          </div>

          <ImageUploader
            label="Reviewer photo"
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

export function ReviewManager({ reviews }: { reviews: AdminReviewRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminReviewRow | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <AdminPageHeader
        title="Reviews"
        description="Customer quotes on the homepage. Each review needs a quote, name, location, photo, and rating."
        actions={
          <AdminButton
            type="button"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Add review
          </AdminButton>
        }
      />

      <AdminCard className="overflow-hidden">
        {reviews.length === 0 ? (
          <p className="p-6 text-sm text-muted">No reviews yet. Add one to show it on the homepage.</p>
        ) : (
          <ul className="divide-y divide-navy/10">
            {reviews.map((review) => (
              <li key={review.id} className="flex items-start gap-4 p-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-brand-50">
                  {review.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={review.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-navy/5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-navy">{review.reviewerName}</p>
                    <span className="text-xs text-muted">{review.reviewerLocation}</span>
                    {!review.isActive ? <span className="text-xs text-amber-700">Hidden</span> : null}
                  </div>
                  <p className="mt-0.5 flex items-center gap-0.5 text-xs text-red">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-red text-red" />
                    ))}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">&ldquo;{review.quote}&rdquo;</p>
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
                        const result = await removeReviewAction({ id: review.id });
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

      <ReviewFormModal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        review={editing}
        nextSortOrder={reviews.reduce((max, row) => Math.max(max, row.sortOrder), 0) + 1}
      />
    </div>
  );
}
