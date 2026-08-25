export type ProductReview = {
  id: string;
  productId: string;
  reviewerName: string;
  title: string;
  body: string;
  rating: number;
  imageUrl: string | null;
  isVerified: boolean;
  createdAt: string;
};

export type AdminProductReviewRow = ProductReview & {
  productName: string;
  productSlug: string;
  imagePublicId: string | null;
  isPublished: boolean;
};

export type AdminProductReviewFormValues = {
  productId: string;
  reviewerName: string;
  title: string;
  body: string;
  rating: number;
  imageUrl?: string;
  imagePublicId?: string | null;
  isVerified: boolean;
  isPublished: boolean;
};

export type ProductReviewProductOption = {
  id: string;
  name: string;
  slug: string;
};
