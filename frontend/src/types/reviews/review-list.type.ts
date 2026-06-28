import type { IProductReview } from './review.type'
import type { IReviewSummary } from './review-summary.type'

/** Whether the current customer may post a review, and why. */
export interface IReviewEligibility {
  canReview: boolean
  hasPurchased: boolean
}

/** Full payload backing a product's reviews section. */
export interface IReviewList {
  summary: IReviewSummary
  items: IProductReview[]
  total: number
  /** The caller's own review, surfaced separately (only it is editable). */
  myReview: IProductReview | null
  eligibility: IReviewEligibility
}

export interface ICreateReviewPayload {
  rating: number
  title?: string
  comment?: string
}

export type IUpdateReviewPayload = Partial<ICreateReviewPayload>
