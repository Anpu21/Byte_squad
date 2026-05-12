import type { IProduct } from '@/types';

export interface CartItem {
    product: IProduct;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    isCustom?: boolean;
}
