export type AccountType =
    | 'Asset'
    | 'Liability'
    | 'Equity'
    | 'Income'
    | 'Expense';

/** Chart-of-accounts node from `GET /accounting/accounts`. */
export interface IAccount {
    id: string;
    code: string;
    name: string;
    type: AccountType;
    isSystem: boolean;
    createdAt: string;
}
