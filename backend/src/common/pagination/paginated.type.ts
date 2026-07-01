/**
 * Standard envelope for one page of a list endpoint. Mirrors the per-module
 * shapes already in use (e.g. `PaginatedSalesReturns`) so the frontend's
 * `IPaginatedResponse<T>` reads every paginated endpoint the same way.
 */
export interface IPaginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
