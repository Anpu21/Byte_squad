export type ReviewStatus = 'visible' | 'hidden'

/** A single product review as shown to customers (reviewer name masked). */
export interface IProductReview {
  id: string
  rating: number
  title: string | null
  comment: string | null
  isVerifiedPurchase: boolean
  reviewerName: string
  createdAt: string
  updatedAt: string
}
