import { LoyaltyLedgerEntryType } from '@common/enums/loyalty-ledger-entry-type.enum';

export interface LoyaltyHistoryEntry {
  id: string;
  type: LoyaltyLedgerEntryType;
  points: number;
  description: string;
  orderCode: string | null;
  createdAt: Date;
}

export interface LoyaltyHistoryResponse {
  entries: LoyaltyHistoryEntry[];
  total: number;
  limit: number;
  offset: number;
}
