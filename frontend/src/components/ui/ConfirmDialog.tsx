import Modal from './Modal';
import Button from './Button';

export interface ConfirmOptions {
    title: string;
    body?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'danger' | 'primary';
}

interface ConfirmDialogProps {
    isOpen: boolean;
    options: ConfirmOptions;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    isOpen,
    options,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const {
        title,
        body,
        confirmLabel = 'Confirm',
        cancelLabel = 'Cancel',
        tone = 'primary',
    } = options;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onCancel}
            title={title}
            maxWidth="sm"
            closeOnBackdrop={tone !== 'danger'}
        >
            {body && (
                <p className="text-sm text-text-2 leading-relaxed">{body}</p>
            )}
            <div className="flex items-center justify-end gap-3 mt-5">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    {cancelLabel}
                </Button>
                <Button
                    type="button"
                    variant={tone === 'danger' ? 'danger' : 'primary'}
                    onClick={onConfirm}
                >
                    {confirmLabel}
                </Button>
            </div>
        </Modal>
    );
}
