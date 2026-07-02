import type { IPaginated } from '@common/pagination/paginated.type';
import type { CategoryProductRow } from './category-product-row.type';

export type CategoryProductSort = 'revenue' | 'units' | 'profit';

/** One page of a category's product roster, brand-tagged. */
export interface CategoryProductsResponse extends IPaginated<CategoryProductRow> {
  categoryId: string;
  categoryName: string;
  startDate: string;
  endDate: string;
  branchId: string | null;
  sort: CategoryProductSort;
}
