import { useCallback, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import UniversalScanner from '@/components/Scanner/UniversalScanner';

interface IPosCameraScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    /**
     * Fires once per detected barcode. The parent resolves the code
     * through the shared `usePosBarcodeScan.triggerScan` so HID and
     * camera scans share the same search-and-status-banner pipeline.
     */
    onScan: (barcode: string) => void;
}

/**
 * Modal wrapper around the project-wide `UniversalScanner`. Mounts the
 * camera view only while `isOpen` is true — `UniversalScanner`'s effect
 * cleanup stops all media tracks on unmount, so closing the modal
 * releases the camera. Debounces against `UniversalScanner`'s own 2-second
 * post-scan pause: an internal ref guards against the rare case of the
 * scanner firing twice for the same detection while the modal is closing.
 */
export function PosCameraScannerModal({
    isOpen,
    onClose,
    onScan,
}: IPosCameraScannerModalProps) {
    const handledRef = useRef(false);

    const handleScanSuccess = useCallback(
        (text: string) => {
            if (handledRef.current) return;
            handledRef.current = true;
            onScan(text);
            onClose();
            // Allow the next open of the modal to capture a fresh scan.
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
            title="Scan a barcode"
            maxWidth="md"
            describedBy="pos-camera-scanner-hint"
        >
            <div className="flex flex-col gap-3">
                <p
                    id="pos-camera-scanner-hint"
                    className="text-[12px] text-text-2"
                >
                    Point the camera at a barcode. The modal closes
                    automatically once a code is detected.
                </p>
                <UniversalScanner onScanSuccess={handleScanSuccess} />
            </div>
        </Modal>
    );
}
