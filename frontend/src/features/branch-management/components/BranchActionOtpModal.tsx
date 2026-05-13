import Modal from '@/components/ui/Modal';
import { BranchActionOtpStep } from './BranchActionOtpStep';
import type {
    BranchActionType,
    IBranchActionConfirmResponse,
} from '@/types';

interface BranchActionOtpModalProps {
    actionId: string;
    expiresAt: string;
    action: BranchActionType;
    branchLabel: string;
    onClose: () => void;
    onConfirmed: (result: IBranchActionConfirmResponse) => void;
}

const TITLE: Record<BranchActionType, string> = {
    create: 'Confirm new branch',
    update: 'Confirm branch changes',
    delete: 'Confirm branch deletion',
};

export function BranchActionOtpModal({
    actionId,
    expiresAt,
    action,
    branchLabel,
    onClose,
    onConfirmed,
}: BranchActionOtpModalProps) {
    return (
        <Modal
            isOpen
            onClose={onClose}
            title={TITLE[action]}
            maxWidth="md"
            closeOnBackdrop={false}
        >
            <BranchActionOtpStep
                actionId={actionId}
                expiresAt={expiresAt}
                action={action}
                branchLabel={branchLabel}
                onConfirmed={onConfirmed}
                onCancel={onClose}
            />
        </Modal>
    );
}
