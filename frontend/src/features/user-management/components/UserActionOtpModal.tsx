import Modal from '@/components/ui/Modal';
import { UserActionOtpStep } from './UserActionOtpStep';
import type {
    UserActionType,
    IUserActionConfirmResponse,
} from '@/types';

interface UserActionOtpModalProps {
    actionId: string;
    expiresAt: string;
    action: UserActionType;
    targetLabel: string;
    onClose: () => void;
    onConfirmed: (result: IUserActionConfirmResponse) => void;
}

const TITLE: Record<UserActionType, string> = {
    create: 'Confirm new user',
    update: 'Confirm user changes',
    delete: 'Confirm user deletion',
    'reset-password': 'Confirm password reset',
};

export function UserActionOtpModal({
    actionId,
    expiresAt,
    action,
    targetLabel,
    onClose,
    onConfirmed,
}: UserActionOtpModalProps) {
    return (
        <Modal
            isOpen
            onClose={onClose}
            title={TITLE[action]}
            maxWidth="md"
            closeOnBackdrop={false}
        >
            <UserActionOtpStep
                actionId={actionId}
                expiresAt={expiresAt}
                action={action}
                targetLabel={targetLabel}
                onConfirmed={onConfirmed}
                onCancel={onClose}
            />
        </Modal>
    );
}
