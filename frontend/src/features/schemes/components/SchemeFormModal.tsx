import Modal from '@/components/ui/Modal';
import type { IDiscountScheme } from '@/types';
import { SchemeForm } from './SchemeForm';

interface ISchemeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Present = edit mode; absent = create mode. */
    scheme?: IDiscountScheme | null;
}

/**
 * Outer shell mounts the form only while open so each open starts with
 * fresh local state (same idiom as `SupplierFormModal`).
 */
export function SchemeFormModal({
    isOpen,
    onClose,
    scheme = null,
}: ISchemeFormModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={scheme ? `Edit ${scheme.name}` : 'New discount scheme'}
            maxWidth="lg"
            closeOnBackdrop={false}
        >
            {isOpen ? <SchemeForm onClose={onClose} scheme={scheme} /> : null}
        </Modal>
    );
}
