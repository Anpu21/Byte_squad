import { LedgerEntry } from '@/modules/accounting-core/entities/ledger-entry.entity';

export interface PaginatedLedger {
  items: LedgerEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
