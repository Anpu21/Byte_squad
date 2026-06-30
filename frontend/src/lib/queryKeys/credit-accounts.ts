import type { ICreditAccountListParams } from '@/types';

export const creditAccounts = {
    all: () => ['credit-accounts'] as const,
    list: (params: ICreditAccountListParams = {}) =>
        ['credit-accounts', 'list', params] as const,
    statement: (id: string) =>
        ['credit-accounts', 'statement', id] as const,
    search: (q: string, branchId?: string) =>
        ['credit-accounts', 'search', q, branchId ?? null] as const,
} as const;
