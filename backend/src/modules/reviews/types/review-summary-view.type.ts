/** Count of reviews at each star level, 1→5. */
export type RatingDistribution = Record<'1' | '2' | '3' | '4' | '5', number>;

/** Aggregate rating for a product, computed from its visible reviews. */
export interface ReviewSummaryView {
  average: number;
  count: number;
  distribution: RatingDistribution;
}
