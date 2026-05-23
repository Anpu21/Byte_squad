import { useCallback, useState } from 'react';
import { useScanDetection } from '@/hooks/useScanDetection';
import { posService } from '@/services/pos.service';
import type { ISearchProductRow } from '@/types';

const STATUS_CLEAR_MS = 2000;

interface IUsePosBarcodeScanOptions {
    onProductFound: (row: ISearchProductRow) => void;
    enabled: boolean;
}

interface IUsePosBarcodeScanReturn {
    scanStatus: string | null;
}

/**
 * POS-specific barcode bridge. Sits on top of `useScanDetection` (HID-style
 * keyboard wedge) and resolves the scanned code against
 * `posService.searchProducts(code, 1)` so the result is already shaped as a
 * Shanel `ISearchProductRow` — matching the typeahead's onSelect contract.
 * On hit, fires `onProductFound`; on miss, surfaces a transient status
 * banner. Disabled by `enabled = false` so consumers can pause scanning
 * while a modal owns focus.
 */
export function usePosBarcodeScan({
    onProductFound,
    enabled,
}: IUsePosBarcodeScanOptions): IUsePosBarcodeScanReturn {
    const [scanStatus, setScanStatus] = useState<string | null>(null);

    const handleScan = useCallback(
        async (barcode: string): Promise<void> => {
            setScanStatus('Scanning…');
            try {
                const rows = await posService.searchProducts(barcode, 1);
                const match = rows[0] ?? null;
                if (match) {
                    onProductFound(match);
                    setScanStatus(`Added: ${match.productName}`);
                } else {
                    setScanStatus(`Not found: ${barcode}`);
                }
            } catch {
                setScanStatus(`Scan failed: ${barcode}`);
            }
            window.setTimeout(() => setScanStatus(null), STATUS_CLEAR_MS);
        },
        [onProductFound],
    );

    useScanDetection({
        onScan: handleScan,
        minLength: 4,
        enabled,
    });

    return { scanStatus };
}
