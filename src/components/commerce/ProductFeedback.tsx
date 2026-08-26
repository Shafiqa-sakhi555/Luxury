"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { toast } from "sonner";
import { submitProductReviewAction } from "@/server/product-reviews/actions";
import { cn } from "@/lib/utils";
import type { ProductReview } from "@/types/product-review";

function StarRow({
  rating,
  size = "md",
  className,
}: {
  rating: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < Math.round(rating);
        return (
          <Star
            key={index}
            className={cn(icon, filled ? "fill-amber-400 text-amber-400" : "fill-transparent text-navy/25")}
          />
        );
      })}
    </span>
  );
}

function ReviewCard({ review }: { review: ProductReview }) {
  return (
    <article className="w-[220px] shrink-0 overflow-hidden border border-navy/10 bg-white sm:w-[240px]">
      {review.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={review.imageUrl} alt="" className="h-36 w-full object-cover sm:h-40" />
      ) : (
        <div className="flex h-28 items-center justify-center bg-brand-50 sm:h-32">
          <StarRow rating={review.rating} />
        </div>
      )}
      <div className="space-y-1.5 p-3">
        <StarRow rating={review.rating} size="sm" />
        <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-navy">
          {review.reviewerName}
          {review.isVerified ? (
            <span className="bg-navy px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
              Verified
            </span>
          ) : null}
        </p>
        {review.title ? <p className="text-sm font-semibold text-navy">{review.title}</p> : null}
        <p className="line-clamp-3 text-xs leading-relaxed text-navy/70">{review.body}</p>
      </div>
    </article>
  );
}

function WriteReviewForm({
  productId,
  productSlug,
  onDone,
}: {
  productId: string;
  productSlug: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rating, setRating] = useState(5);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("rating", String(rating));
    startTransition(async () => {
      const result = await submitProductReviewAction(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Thank you — your review is live.");
      form.reset();
      setRating(5);
      onDone();
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3 border border-navy/10 bg-brand-50/60 p-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="productSlug" value={productSlug} />
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Your rating</p>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, index) => {
            const value = index + 1;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="p-0.5"
                aria-label={`${value} stars`}
              >
                <Star
                  className={cn(
                    "h-5 w-5",
                    value <= rating ? "fill-amber-400 text-amber-400" : "fill-transparent text-navy/25"
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label htmlFor="reviewerName" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Your name
        </label>
        <input
          id="reviewerName"
          name="reviewerName"
          required
          maxLength={80}
          placeholder="Your name"
          className="h-10 w-full border border-navy/15 bg-white px-3 text-sm text-navy outline-none focus:border-navy"
        />
      </div>
      <div>
        <label htmlFor="reviewTitle" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Title (optional)
        </label>
        <input
          id="reviewTitle"
          name="title"
          maxLength={120}
          placeholder="Amazing quality"
          className="h-10 w-full border border-navy/15 bg-white px-3 text-sm text-navy outline-none focus:border-navy"
        />
      </div>
      <div>
        <label htmlFor="reviewBody" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Your review
        </label>
        <textarea
          id="reviewBody"
          name="body"
          required
          minLength={8}
          maxLength={2000}
          rows={4}
          placeholder="Tell others what you liked about this product."
          className="w-full border border-navy/15 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        />
      </div>
      <div>
        <label htmlFor="reviewPhoto" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Photo (optional)
        </label>
        <input
          id="reviewPhoto"
          name="photo"
          type="file"
          accept="image/*"
          className="w-full text-xs text-muted file:mr-3 file:border file:border-navy file:bg-white file:px-3 file:py-1.5 file:text-[10px] file:font-semibold file:uppercase file:tracking-wide file:text-navy"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-navy px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}

export function ProductFeedback({
  productId,
  productSlug,
  reviews,
}: {
  productId: string;
  productSlug: string;
  reviews: ProductReview[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [writing, setWriting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const average = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [reviews]);

  const visible = expanded ? reviews : reviews.slice(0, 8);

  function scrollByCard(direction: -1 | 1) {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * 248, behavior: "smooth" });
  }

  return (
    <section className="mt-6 border-t border-navy/15 pt-5" aria-label="Customer reviews">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <StarRow rating={reviews.length === 0 ? 0 : average} />
        <p className="text-sm text-navy/80">
          {reviews.length === 0
            ? "Be the first to write a review."
            : `from ${reviews.length} review${reviews.length === 1 ? "" : "s"}`}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setWriting((open) => !open)}
        className="mt-3 w-full bg-navy px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-navy/90"
      >
        {writing ? "Cancel" : "Write a review"}
      </button>

      {writing ? (
        <WriteReviewForm
          productId={productId}
          productSlug={productSlug}
          onDone={() => setWriting(false)}
        />
      ) : null}

      {reviews.length > 0 ? (
        <>
          <div className="mt-5">
            <h2 className="font-display text-xl text-navy sm:text-2xl">Let customers speak for us</h2>
            <p className="mt-1 text-sm text-muted">from {reviews.length} reviews</p>
          </div>

          <div
            ref={scrollerRef}
            className="mt-4 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {visible.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {reviews.length > 1 ? (
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollByCard(-1)}
                className="flex h-8 w-8 items-center justify-center border border-navy/15 text-navy hover:bg-navy hover:text-white"
                aria-label="Previous reviews"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollByCard(1)}
                className="flex h-8 w-8 items-center justify-center border border-navy/15 text-navy hover:bg-navy hover:text-white"
                aria-label="Next reviews"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          {reviews.length > 8 ? (
            <button
              type="button"
              onClick={() => setExpanded((open) => !open)}
              className="mt-4 w-full bg-navy px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-navy/90"
            >
              {expanded ? "Show fewer reviews" : "Read more reviews"}
            </button>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
