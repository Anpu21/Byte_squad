import { useCallback, useRef } from 'react';
import { Modal } from '@/components/ui';
import UniversalScanner from '@/components/Scanner/UniversalScanner';

interface PosPickupScanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (code: string) => void;
}

/**
 * Camera modal for scanning a customer's pickup QR. Mounting the scanner only
 * while open means `UniversalScanner`'s cleanup stops the media tracks on
 * close — the camera is released as soon as the modal closes. An internal ref
 * guards against a double-fire while the modal is closing.
 */
export function PosPickupScanModal({
    isOpen,
    onClose,
    onScan,
}: PosPickupScanModalProps) {
    const handledRef = useRef(false);

    const handleScanSuccess = useCallback(
        (text: string) => {
            if (handledRef.current) return;
            handledRef.current = true;
            onScan(text);
            onClose();
            window.setTimeout(() => {
                handledRef.current = false;
            }, 500);
        },
        [onScan, onClose],
    );

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Scan pickup QR"
            maxWidth="md"
            describedBy="pickup-scan-hint"
        >
            <div className="flex flex-col gap-3">
                <p id="pickup-scan-hint" className="text-[12px] text-text-2">
                    Point the camera at the customer&apos;s pickup QR. The order
                    opens automatically once a code is detected.
                </p>
                <UniversalScanner onScanSuccess={handleScanSuccess} />
            </div>
        </Modal>
    );
}
