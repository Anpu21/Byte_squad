import type { IProduct } from '@/types';

export interface TransferRequestCartLine {
    product: IProduct;
    quantity: number;
}
