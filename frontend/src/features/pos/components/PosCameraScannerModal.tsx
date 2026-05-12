import Modal from '@/components/ui/Modal';
import UniversalScanner from '@/components/Scanner/UniversalScanner';

interface PosCameraScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (barcode: string) => void;
}

export default function PosCameraScannerModal({
    isOpen,
    onClose,
    onScan,
}: PosCameraScannerModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Scan barcode" maxWidth="lg">
            <UniversalScanner
                onScanSuccess={(scannedBarcode) => {
                    onScan(scannedBarcode);
                    onClose();
                }}
            />
        </Modal>
    );
}
