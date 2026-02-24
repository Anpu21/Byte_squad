import { useEffect, useRef, useCallback } from 'react';

/**
 * Configuration for the USB barcode scan detection hook.
 */
interface UseScanDetectionOptions {
    /**
     * Callback fired when a valid barcode scan is detected.
     * @param barcode - The scanned barcode string.
     */
    onScan: (barcode: string) => void;

    /**
     * Maximum time (ms) allowed between consecutive keystrokes
     * to be considered part of a scan sequence.
     * USB scanners typically fire keys at 10-30ms intervals.
     * Human typing is typically 100-200ms+ between keys.
     * @default 50
     */
    maxTimeBetweenKeys?: number;

    /**
     * Minimum length of the scanned barcode to accept.
     * Filters out accidental short sequences.
     * @default 4
     */
    minLength?: number;

    /**
     * Whether the scan detection is currently enabled.
     * Useful for disabling when a text input is focused.
     * @default true
     */
    enabled?: boolean;

    /**
     * Prefix characters that some scanners add
     * before the barcode data. These will be stripped.
     * @default []
     */
    prefixChars?: string[];

    /**
     * Suffix characters that some scanners append.
     * "Enter" is handled automatically as the terminator.
     * @default []
     */
    suffixChars?: string[];
}

/**
 * Detect rapid keystroke input from a USB barcode scanner (HID device).
 *
 * USB scanners emulate keyboard input, firing characters in rapid
 * succession (typically 10-30ms between keystrokes) followed by Enter.
 * This hook distinguishes scanner input from normal human typing
 * based on the inter-key timing.
 *
 * @example
 * ```tsx
 * useScanDetection({
 *   onScan: (barcode) => {
 *     dispatch(addItemByBarcode(barcode));
 *   },
 *   minLength: 6,
 *   enabled: !isModalOpen,
 * });
 * ```
 */
export function useScanDetection({
    onScan,
    maxTimeBetweenKeys = 50,
    minLength = 4,
    enabled = true,
    prefixChars = [],
    suffixChars = [],
}: UseScanDetectionOptions): void {
    const bufferRef = useRef<string>('');
    const lastKeyTimeRef = useRef<number>(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const resetBuffer = useCallback(() => {
        bufferRef.current = '';
        lastKeyTimeRef.current = 0;
    }, []);

    useEffect(() => {
        if (!enabled) {
            resetBuffer();
            return;
        }

        const handleKeyDown = (event: KeyboardEvent): void => {
            // Ignore modifier keys
            if (event.ctrlKey || event.altKey || event.metaKey) {
                return;
            }

            const now = Date.now();
            const timeSinceLastKey = now - lastKeyTimeRef.current;

            // If too much time has passed, this is a new sequence
            if (lastKeyTimeRef.current > 0 && timeSinceLastKey > maxTimeBetweenKeys) {
                resetBuffer();
            }

            lastKeyTimeRef.current = now;

            // Clear any pending reset timeout
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            // Handle Enter key (scan terminator)
            if (event.key === 'Enter') {
                const scannedBarcode = cleanBarcode(
                    bufferRef.current,
                    prefixChars,
                    suffixChars,
                );

                if (scannedBarcode.length >= minLength) {
                    // Prevent form submission when scanner fires Enter
                    event.preventDefault();
                    event.stopPropagation();
                    onScan(scannedBarcode);
                }

                resetBuffer();
                return;
            }

            // Only accumulate printable single characters
            if (event.key.length === 1) {
                bufferRef.current += event.key;
            }

            // Safety: reset buffer if no Enter arrives within a reasonable window
            timeoutRef.current = setTimeout(() => {
                resetBuffer();
            }, maxTimeBetweenKeys * 3);
        };

        window.addEventListener('keydown', handleKeyDown, { capture: true });

        return () => {
            window.removeEventListener('keydown', handleKeyDown, { capture: true });
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current);
            }
            resetBuffer();
        };
    }, [enabled, maxTimeBetweenKeys, minLength, onScan, prefixChars, suffixChars, resetBuffer]);
}

/**
 * Strip known prefix/suffix characters from scanned barcode.
 */
function cleanBarcode(
    raw: string,
    prefixes: string[],
    suffixes: string[],
): string {
    let result = raw;

    for (const prefix of prefixes) {
        if (result.startsWith(prefix)) {
            result = result.slice(prefix.length);
        }
    }

    for (const suffix of suffixes) {
        if (result.endsWith(suffix)) {
            result = result.slice(0, -suffix.length);
        }
    }

    return result.trim();
}
