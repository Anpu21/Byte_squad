export interface ProductFormErrors {
    name?: string;
    barcode?: string;
    pluCode?: string;
    category?: string;
    costPrice?: string;
    sellingPrice?: string;
    initialStock?: string;
    lowStockThreshold?: string;
    sellableUnits?: string;
    general?: string;
}

export type BarcodeLookupStatus = 'idle' | 'looking' | 'found' | 'new';
