import type { DiscountSchemeScope } from '@/types';

export interface SchemeFormValues {
    name: string;
    branchId: string;
    scope: DiscountSchemeScope;
    productId: string;
    productDraft: string | null;
    category: string;
    minQty: string;
    discountPercentage: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export type SetSchemeField = <K extends keyof SchemeFormValues>(
    key: K,
    value: SchemeFormValues[K],
) => void;

export interface SchemeOption {
    id: string;
    name: string;
}
