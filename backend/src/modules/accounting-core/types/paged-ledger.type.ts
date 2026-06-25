import { LedgerEntry } from '@/modules/accounting-core/entities/ledger-entry.entity';

export interface PagedLedger {
  items: LedgerEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
