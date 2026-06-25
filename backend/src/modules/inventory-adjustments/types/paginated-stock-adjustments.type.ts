import { StockAdjustment } from '@/modules/inventory-adjustments/entities/stock-adjustment.entity';

export interface PaginatedStockAdjustments {
  items: StockAdjustment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
