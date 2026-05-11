import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { IExpense } from '@/types';

interface ReviewExpenseModalProps {
    expense: IExpense;
    action: 'approved' | 'rejected';
    onCancel: () => void;
    onConfirm: (note: string) => void;
}

export default function ReviewExpenseModal({
    expense,
    action,
    onCancel,
    onConfirm,
}: ReviewExpenseModalProps) {
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const isReject = action === 'rejected';

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await onConfirm(note);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen
            onClose={onCancel}
            title={isReject ? 'Reject expense' : 'Approve expense'}
            maxWidth="md"
        >
            <div>
                <p className="text-sm text-text-2 mb-4">
                    {expense.category} —{' '}
                    <span className="mono">
                        {new Intl.NumberFormat('en-LK', {
                            style: 'currency',
                            currency: 'LKR',
                            maximumFractionDigits: 0,
                        }).format(Number(expense.amount))}
                    </span>
                </p>

                <label className="block text-xs font-medium text-text-2 mb-1.5">
                    Note {isReject ? '(reason)' : '(optional)'}
                </label>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={
                        isReject
                            ? 'Why is this being rejected?'
                            : 'Optional note'
                    }
                    rows={3}
                    className="w-full px-3 py-2 bg-canvas border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/25 placeholder:text-text-3 transition-colors resize-none"
                />

                <div className="flex items-center justify-end gap-2 mt-5">
                    <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={onCancel}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant={isReject ? 'danger' : 'primary'}
                        size="md"
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting
                            ? 'Saving…'
                            : isReject
                              ? 'Reject'
                              : 'Approve'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
