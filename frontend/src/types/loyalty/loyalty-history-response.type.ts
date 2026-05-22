import type { ILoyaltyHistoryEntry } from './loyalty-history-entry.type'

export interface ILoyaltyHistoryResponse {
    entries: ILoyaltyHistoryEntry[]
    total: number
    limit: number
    offset: number
}
