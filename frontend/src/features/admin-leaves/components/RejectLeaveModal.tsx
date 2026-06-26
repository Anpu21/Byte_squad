import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import type { ILeave } from '@/types';
import { useRejectLeave } from '../hooks/useRejectLeave';
import { formatLeaveType } from '../lib/leave-formatting';

interface IRejectLeaveModalProps {
    leave: ILeave | null;
    onClose: () => void;
}

const MIN_REASON = 3;

/**
 * Wrapper that only mounts the form when a leave is selected — the
 * reason textarea then has fresh local state per rejection without
 * needing an effect to wipe it.
 */
export function RejectLeaveModal({ leave, onClose }: IRejectLeaveModalProps) {
    return (
        <Modal
            isOpen={leave !== null}
            onClose={onClose}
            title="Reject leave"
            maxWidth="md"
            closeOnBackdrop={false}
        >
            {leave ? <RejectLeaveForm leave={leave} onClose={onClose} /> : null}
        </Modal>
    );
}

interface IRejectLeaveFormProps {
    leave: ILeave;
    onClose: () => void;
}

function RejectLeaveForm({ leave, onClose }: IRejectLeaveFormProps) {
    const reject = useRejectLeave();
    const [reason, setReason] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (reason.trim().length < MIN_REASON) return;
        try {
            await reject.mutateAsync({
                id: leave.id,
                rejectionReason: reason.trim(),
            });
            toast.success('Leave rejected');
            onClose();
        } catch {
            toast.error('Could not reject leave');
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-[13px] text-text-2">
                Rejecting{' '}
                <span className="text-text-1 font-medium">
                    {formatLeaveType(leave.leaveType)}
                </span>{' '}
                for{' '}
                <span className="text-text-1 font-medium">
                    {Number(leave.totalDays).toFixed(1)} day(s)
                </span>{' '}
                from {leave.startDate} to {leave.endDate}.
            </p>
            <label className="block space-y-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Reason ({MIN_REASON}+ chars)
                </span>
                <textarea
                    className="w-full min-h-[88px] px-3 py-2 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-focus focus:ring-[3px] focus:ring-focus/25 transition-colors"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Required — visible to the employee."
                    autoFocus
                    maxLength={1000}
                />
            </label>
            <div className="flex justify-end gap-2 pt-1">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    disabled={reject.isPending}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="danger"
                    disabled={reject.isPending || reason.trim().length < MIN_REASON}
                >
                    {reject.isPending ? 'Rejecting…' : 'Reject leave'}
                </Button>
            </div>
        </form>
    );
}
