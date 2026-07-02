import type { SalesReturn } from '@inventory/entities/sales-return.entity';
import type { Sale } from '@pos/entities/sale.entity';

/**
 * Result of a customer exchange: the return leg (goods in) and the replacement
 * Sale (goods out). Both are persisted in one transaction; the SalesReturn's
 * `replacementSaleId` and the Sale's `exchangeReturnId` cross-link the pair.
 */
export interface ExchangeResult {
  salesReturn: SalesReturn;
  replacementSale: Sale;
}
