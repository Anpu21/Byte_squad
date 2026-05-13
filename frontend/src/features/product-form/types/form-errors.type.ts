export interface ProductFormErrors {
    name?: string;
    barcode?: string;
    category?: string;
    costPrice?: string;
    sellingPrice?: string;
    initialStock?: string;
    lowStockThreshold?: string;
    general?: string;
}

export type BarcodeLookupStatus = 'idle' | 'looking' | 'found' | 'new';
