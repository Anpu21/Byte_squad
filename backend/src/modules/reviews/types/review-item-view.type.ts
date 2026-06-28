/** A single review as shown to customers — reviewer name masked, no userId. */
export interface ReviewItemView {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerifiedPurchase: boolean;
  reviewerName: string;
  createdAt: string;
  updatedAt: string;
}
