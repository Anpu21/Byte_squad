export const LOYALTY_LEDGER_ENTRY_TYPE = {
    EARNED: 'earned',
    REDEEMED: 'redeemed',
    REVERSED: 'reversed',
    EARN_REVERSED: 'earn_reversed',
    MERGE_TRANSFER: 'merge_transfer',
    ADJUSTED: 'adjusted',
} as const

export type LoyaltyLedgerEntryType =
    (typeof LOYALTY_LEDGER_ENTRY_TYPE)[keyof typeof LOYALTY_LEDGER_ENTRY_TYPE]
