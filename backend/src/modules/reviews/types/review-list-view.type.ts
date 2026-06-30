import { ReviewItemView } from './review-item-view.type';
import { ReviewSummaryView } from './review-summary-view.type';

/** Whether the current customer may post a review, and why. */
export interface ReviewEligibility {
  canReview: boolean;
  hasPurchased: boolean;
}

/** The full payload backing a product's reviews section. */
export interface ReviewListView {
  summary: ReviewSummaryView;
  items: ReviewItemView[];
  total: number;
  /** The caller's own review (surfaced separately so only it is editable). */
  myReview: ReviewItemView | null;
  eligibility: ReviewEligibility;
}
