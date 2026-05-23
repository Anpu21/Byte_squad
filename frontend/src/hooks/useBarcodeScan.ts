import { useCallback, useState } from 'react';
import { useScanDetection } from '@/hooks/useScanDetection';
import { inventoryService } from '@/services/inventory.service';
import type { IProduct } from '@/types';

const STATUS_CLEAR_MS = 2000;

interface UseBarcodeScanOptions {
    onProductFound: (product: IProduct) => void;
    enabled: boolean;
}

/**
 * Generic barcode scan hook shared by POS and stock-transfer workspaces.
 * Listens for HID-style scanner input via `useScanDetection`, resolves the
 * barcode against the inventory service, and exposes a transient status
 * banner so the consumer can render the latest scan result.
 */
export function useBarcodeScan({
    onProductFound,
    enabled,
}: UseBarcodeScanOptions) {
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
