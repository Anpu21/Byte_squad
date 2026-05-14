import type { IProduct } from '@/types';

export interface TransferCartLine {
    product: IProduct;
    quantity: number;
}
