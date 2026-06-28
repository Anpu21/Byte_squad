export enum ProductReviewStatus {
  /** Public — counted in the product aggregate and shown in the review list. */
  VISIBLE = 'visible',
  /** Soft-hidden by staff — excluded from the aggregate + list; row retained
   *  so the unique (product, user) key still blocks the author re-posting. */
  HIDDEN = 'hidden',
}
