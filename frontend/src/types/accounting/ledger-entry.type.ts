import type { LedgerEntryType } from '@/constants/enums'

export interface ILedgerEntry {
  id: string
  branchId: string
  entryType: LedgerEntryType
  amount: number
  description: string
  referenceNumber: string
  transactionId: string | null
  createdAt: string
}
