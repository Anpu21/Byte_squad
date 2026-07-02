import type { ICategoryProductSort } from './category-products-response.type'

export interface ICategoryProductsParams {
  startDate: string
  endDate: string
  branchId?: string
  brandId?: string
  search?: string
  sort?: ICategoryProductSort
  page?: number
  limit?: number
}
