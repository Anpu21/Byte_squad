import Modal from '@/components/ui/Modal';
import type { IEmployee } from '@/types';
import { ApplyLeaveForm } from './ApplyLeaveForm';

interface IApplyLeaveModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Selectable employees (manager/admin on-behalf flows). */
    employees: IEmployee[];
    /**
     * Self-apply flows (cashier) hide the employee picker — the BE
     * resolves the actor's own employee record when the id is omitted.
     */
    hideEmployee?: boolean;
}

/**
 * Outer shell mounts the form only while open so each open starts
 * with fresh local state — no resetting effects needed.
 */
export function ApplyLeaveModal({
    isOpen,
    onClose,
    employees,
    hideEmployee = false,
}: IApplyLeaveModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Apply for leave"
            maxWidth="lg"
            closeOnBackdrop={false}
        >
            {isOpen ? (
                <ApplyLeaveForm
                    onClose={onClose}
                    employees={employees}
                    hideEmployee={hideEmployee}
                />
            ) : null}
        </Modal>
    );
}
