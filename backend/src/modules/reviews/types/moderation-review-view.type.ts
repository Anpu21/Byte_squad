import { ProductReviewStatus } from '@common/enums/product-review.enum';

/** A review as shown to staff in the moderation tool (full reviewer name). */
export interface ModerationReviewView {
  id: string;
  productId: string;
  productName: string;
  rating: number;
  title: string | null;
  comment: string | null;
  status: ProductReviewStatus;
  isVerifiedPurchase: boolean;
  reviewerName: string;
  createdAt: string;
  moderatedAt: string | null;
  moderationReason: string | null;
}

export interface PagedModerationReviews {
  rows: ModerationReviewView[];
  total: number;
}
