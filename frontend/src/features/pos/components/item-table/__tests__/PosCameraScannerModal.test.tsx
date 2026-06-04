import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PosCameraScannerModal } from '../PosCameraScannerModal';

// Mock UniversalScanner so jsdom doesn't try to start a camera.
// The mock exposes a "Simulate scan" button so tests can drive
// the onScanSuccess callback deterministically.
vi.mock('@/components/Scanner/UniversalScanner', () => ({
    __esModule: true,
    default: ({
        onScanSuccess,
    }: {
        onScanSuccess?: (text: string) => void;
    }) => (
        <button
            type="button"
            data-testid="universal-scanner-stub"
            onClick={() => onScanSuccess?.('1234567890123')}
        >
            Simulate scan
        </button>
    ),
}));

describe('PosCameraScannerModal', () => {
    it('renders nothing when isOpen is false', () => {
        const onScan = vi.fn<(barcode: string) => void>();
        const onClose = vi.fn<() => void>();
        render(
            <PosCameraScannerModal
                isOpen={false}
                onClose={onClose}
                onScan={onScan}
            />,
        );
        // No modal title, no scanner mounted.
        expect(screen.queryByText('Scan a barcode')).toBeNull();
        expect(
            screen.queryByTestId('universal-scanner-stub'),
        ).toBeNull();
    });

    it('renders the scanner and hint when isOpen is true', () => {
        const onScan = vi.fn<(barcode: string) => void>();
        const onClose = vi.fn<() => void>();
        render(
            <PosCameraScannerModal
                isOpen
                onClose={onClose}
                onScan={onScan}
            />,
        );
        expect(screen.getByText('Scan a barcode')).toBeInTheDocument();
        expect(
            screen.getByText(/Point the camera at a barcode/),
        ).toBeInTheDocument();
        expect(
            screen.getByTestId('universal-scanner-stub'),
        ).toBeInTheDocument();
    });

    it('fires onScan with the detected barcode and closes the modal', async () => {
        const onScan = vi.fn<(barcode: string) => void>();
        const onClose = vi.fn<() => void>();
        render(
            <PosCameraScannerModal
                isOpen
                onClose={onClose}
                onScan={onScan}
            />,
        );
        await userEvent.click(
            screen.getByTestId('universal-scanner-stub'),
        );
        expect(onScan).toHaveBeenCalledWith('1234567890123');
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('debounces duplicate scans within the same modal session', async () => {
        const onScan = vi.fn<(barcode: string) => void>();
        const onClose = vi.fn<() => void>();
        render(
            <PosCameraScannerModal
                isOpen
                onClose={onClose}
                onScan={onScan}
            />,
        );
        const stub = screen.getByTestId('universal-scanner-stub');
        await userEvent.click(stub);
        await userEvent.click(stub);
        // Even though the mock fires twice in rapid succession, the
        // modal's handledRef guard means only the first scan reaches
        // the parent.
        expect(onScan).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
