import type { IInventoryParams } from '@/types';

export const inventory = {
    all: () => ['inventory'] as const,
    categories: () => ['inventory', 'categories'] as const,
    brands: () => ['inventory', 'brands'] as const,
    byBranch: (branchId: string, params?: IInventoryParams) =>
        ['inventory', 'by-branch', branchId, params ?? {}] as const,
} as const;
