import type { LedgerEntryType } from '@/constants/enums'
import type { IBranch } from '@/types'

export interface ILedgerEntry {
  id: string
  branchId: string
  branch?: IBranch
  entryType: LedgerEntryType
  amount: number
  description: string
  referenceNumber: string
  transactionId: string | null
  createdAt: string
}
