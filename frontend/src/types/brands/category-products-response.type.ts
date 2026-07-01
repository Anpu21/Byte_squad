import type { ICategoryProductRow } from './category-product-row.type'

export type ICategoryProductSort = 'revenue' | 'units' | 'profit'

/** One page of a category's brand-tagged product roster. */
export interface ICategoryProductsResponse {
  items: ICategoryProductRow[]
  total: number
  page: number
  limit: number
  totalPages: number
  categoryId: string
  categoryName: string
  startDate: string
  endDate: string
  branchId: string | null
  sort: ICategoryProductSort
}
