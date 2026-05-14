import Modal from '@/components/ui/Modal';
import UniversalScanner from '@/components/Scanner/UniversalScanner';

interface AdminTransferCameraScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (barcode: string) => void;
}

export function AdminTransferCameraScannerModal({
    isOpen,
    onClose,
    onScan,
}: AdminTransferCameraScannerModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Scan barcode"
            maxWidth="lg"
        >
            <UniversalScanner
                onScanSuccess={(scannedBarcode) => {
                    onScan(scannedBarcode);
                    onClose();
                }}
            />
        </Modal>
    );
}
