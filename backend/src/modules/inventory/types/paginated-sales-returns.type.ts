import { SalesReturn } from '@inventory/entities/sales-return.entity';

export interface PaginatedSalesReturns {
  items: SalesReturn[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
