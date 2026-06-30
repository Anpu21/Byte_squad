import type { ReviewStatus } from './review.type'

/** A review as shown to staff in the moderation tool (full reviewer name). */
export interface IModerationReview {
  id: string
  productId: string
  productName: string
  rating: number
  title: string | null
  comment: string | null
  status: ReviewStatus
  isVerifiedPurchase: boolean
  reviewerName: string
  createdAt: string
  moderatedAt: string | null
  moderationReason: string | null
}

export interface IPagedModerationReviews {
  rows: IModerationReview[]
  total: number
}
