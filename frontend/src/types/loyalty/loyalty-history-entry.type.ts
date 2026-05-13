import type { LoyaltyLedgerEntryType } from './loyalty-ledger-entry-type.type'

export interface ILoyaltyHistoryEntry {
    id: string
    type: LoyaltyLedgerEntryType
    points: number
    description: string
    orderCode: string | null
    createdAt: string
}
