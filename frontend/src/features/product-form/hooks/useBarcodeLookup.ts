import { useCallback } from 'react';
import { inventoryService } from '@/services/inventory.service';
import type { ProductFormState } from './useProductFormState';
import { BARCODE_MIN_LOOKUP_LENGTH } from '../lib/constants';

const SCAN_PULSE_MS = 2000;
const STATUS_CLEAR_MS = 3000;

interface UseBarcodeLookupArgs {
    isEditMode: boolean;
    form: ProductFormState;
}

export function useBarcodeLookup({
    isEditMode,
    form,
}: UseBarcodeLookupArgs) {
    return useCallback(
        async (scannedBarcode: string) => {
            form.setBarcode(scannedBarcode);
            form.setScanDetected(true);
            setTimeout(() => form.setScanDetected(false), SCAN_PULSE_MS);

            if (isEditMode || scannedBarcode.length < BARCODE_MIN_LOOKUP_LENGTH) return;

            form.setBarcodeStatus('looking');
            const product = await inventoryService.getProductByBarcode(
                scannedBarcode,
            );

            if (product) {
                form.setName(product.name);
                form.setCategory(product.category);
                form.setDescription(product.description || '');
                form.setCostPrice(String(product.costPrice));
                form.setSellingPrice(String(product.sellingPrice));
                form.setBarcodeStatus('found');
            } else {
                form.setBarcodeStatus('new');
            }

            setTimeout(() => form.setBarcodeStatus('idle'), STATUS_CLEAR_MS);
        },
        [isEditMode, form],
    );
}
