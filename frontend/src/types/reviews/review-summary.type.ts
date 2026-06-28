/** Number of reviews at each star level, 1→5. */
export type IRatingDistribution = Record<'1' | '2' | '3' | '4' | '5', number>

/** Aggregate rating for a product, from its visible reviews. */
export interface IReviewSummary {
  average: number
  count: number
  distribution: IRatingDistribution
}
