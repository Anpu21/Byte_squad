/** Default rows per page when a list request omits `limit`. */
export const DEFAULT_PAGE_SIZE = 10;

/** Hard cap on `limit` so a client can't request an unbounded page. */
export const MAX_PAGE_SIZE = 100;
