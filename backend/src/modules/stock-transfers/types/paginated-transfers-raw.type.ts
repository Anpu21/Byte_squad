import { StockTransferRequest } from '@stock-transfers/entities/stock-transfer-request.entity';

export interface PaginatedTransfersRaw {
  items: StockTransferRequest[];
  total: number;
}
