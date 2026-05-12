import { useCallback, useState } from 'react';
import { useScanDetection } from '@/hooks/useScanDetection';
import { inventoryService } from '@/services/inventory.service';
import type { IProduct } from '@/types';

const STATUS_CLEAR_MS = 2000;

interface UsePosBarcodeScanOptions {
    onProductFound: (product: IProduct) => void;
    enabled: boolean;
}

export function usePosBarcodeScan({
    onProductFound,
    enabled,
}: UsePosBarcodeScanOptions) {
    const [scanStatus, setScanStatus] = useState<string | null>(null);

    const handleBarcodeScan = useCallback(
        async (barcode: string) => {
            setScanStatus('Scanning...');
            const product = await inventoryService.getProductByBarcode(barcode);
            if (product) {
                onProductFound(product);
                setScanStatus(`Added: ${product.name}`);
            } else {
                setScanStatus(`Product not found: ${barcode}`);
            }
            setTimeout(() => setScanStatus(null), STATUS_CLEAR_MS);
        },
        [onProductFound],
    );

    useScanDetection({
        onScan: handleBarcodeScan,
        minLength: 4,
        enabled,
    });

    return { scanStatus, handleBarcodeScan };
}
