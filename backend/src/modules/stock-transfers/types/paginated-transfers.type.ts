import { StockTransferRequest } from '@stock-transfers/entities/stock-transfer-request.entity';

export interface PaginatedTransfers {
  items: StockTransferRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
