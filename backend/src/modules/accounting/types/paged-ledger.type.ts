import { LedgerEntry } from '@accounting/entities/ledger-entry.entity';

export interface PagedLedger {
  items: LedgerEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
