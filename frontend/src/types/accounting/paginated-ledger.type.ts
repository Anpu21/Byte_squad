import type { ILedgerEntry } from '@/types/accounting/ledger-entry.type'

export interface IPaginatedLedger {
  items: ILedgerEntry[]
  total: number
  page: number
  limit: number
  totalPages: number
}
