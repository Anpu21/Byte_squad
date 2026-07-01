import Modal from '@/components/ui/Modal';
import type { ISupplier } from '@/types';
import { SupplierForm } from './SupplierForm';

interface ISupplierFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Present = edit mode; absent = create mode. */
    supplier?: ISupplier | null;
}

/**
 * Outer shell mounts the form only while open so each open starts with
 * fresh local state (same idiom as `ApplyLeaveModal`).
 */
export function SupplierFormModal({
    isOpen,
    onClose,
    supplier = null,
}: ISupplierFormModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={supplier ? `Edit ${supplier.name}` : 'Add supplier'}
            maxWidth="lg"
            closeOnBackdrop={false}
        >
            {isOpen ? (
                <SupplierForm onClose={onClose} supplier={supplier} />
            ) : null}
        </Modal>
    );
}
