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
    /**
     * Imperatively resolve a barcode string through the same
     * search-then-status-banner pipeline the HID listener uses. The camera
     * scanner modal calls this when it detects a code so both scanning
     * surfaces share one resolution path. Always runs regardless of the
     * `enabled` flag (which only gates the keyboard wedge).
     */
    triggerScan: (barcode: string) => Promise<void>;
}

/**
 * POS-specific barcode bridge. Sits on top of `useScanDetection` (HID-style
 * keyboard wedge) and resolves the scanned code against
 * `posService.searchProducts(code, 1)` so the result is already shaped as a
 * Shanel `ISearchProductRow` — matching the typeahead's onSelect contract.
 * On hit, fires `onProductFound`; on miss, surfaces a transient status
 * banner. The HID listener is disabled by `enabled = false` so consumers can
 * pause keyboard scanning while a modal owns focus; the returned
 * `triggerScan` is always available for imperative use (e.g., camera scan).
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

    return { scanStatus, triggerScan: handleScan };
}
