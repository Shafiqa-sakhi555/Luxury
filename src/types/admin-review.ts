export type AdminReviewRow = {
  id: string;
  reviewerName: string;
  reviewerLocation: string;
  quote: string;
  rating: number;
  imageUrl: string | null;
  imagePublicId: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type AdminReviewFormValues = {
  reviewerName: string;
  reviewerLocation: string;
  quote: string;
  rating: number;
  imageUrl?: string;
  imagePublicId?: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type StorefrontReview = {
  id: string;
  name: string;
  location: string;
  quote: string;
  rating: number;
  imageUrl: string;
};
