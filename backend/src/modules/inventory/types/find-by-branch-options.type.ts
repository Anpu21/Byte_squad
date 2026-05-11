import { StockStatus } from '@inventory/types/stock-status.type';

export interface FindByBranchOptions {
  branchId: string;
  search?: string;
  category?: string;
  stockStatus?: StockStatus;
  page: number;
  limit: number;
}
