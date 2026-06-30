import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Segmented from '@/components/ui/Segmented';
import { formatCurrency } from '@/lib/utils';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import type { CashMovementType, IShiftLiveSummary } from '@/types';
import { useShiftMutations } from '../../hooks/useShiftMutations';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

const TYPE_OPTIONS: { label: string; value: CashMovementType }[] = [
    { label: 'Cash in', value: 'PayIn' },
    { label: 'Pay out', value: 'PayOut' },
];

interface IPosCashMovementModalProps {
    isOpen: boolean;
    onClose: () => void;
    live: IShiftLiveSummary | null;
}

/**
 * Record a mid-shift drawer movement — cash paid in (float top-up) or paid out
 * (petty cash, supplier cash). Adjusts the shift's expected-cash so the day-end
 * over/short stays explainable. A pay-out can't exceed the cash on hand.
 */
export function PosCashMovementModal({
    isOpen,
    onClose,
    live,
}: IPosCashMovementModalProps) {
    const { recordMovement } = useShiftMutations();
    const [type, setType] = useState<CashMovementType>('PayOut');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');

    const amountNum = Number(amount);
    const drawerCash = live?.expectedCash ?? 0;
    const overDraw = type === 'PayOut' && amountNum > drawerCash;
    const canSubmit =
        Number.isFinite(amountNum) &&
        amountNum > 0 &&
        amount !== '' &&
        !overDraw;

    function reset() {
        setType('PayOut');
        setAmount('');
        setReason('');
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSubmit || recordMovement.isPending) return;
        try {
            await recordMovement.mutateAsync({
                type,
                amount: amountNum,
                reason: reason.trim() || undefined,
            });
            toast.success(
                type === 'PayIn'
                    ? 'Cash added to the drawer'
                    : 'Pay-out recorded',
            );
            reset();
            onClose();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                toast.error(data?.message ?? 'Could not record the movement');
            } else {
                toast.error('Could not record the movement');
            }
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Cash drawer movement"
            maxWidth="sm"
            closeOnBackdrop={false}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Segmented
                    className="w-full"
                    value={type}
                    onChange={setType}
                    options={TYPE_OPTIONS}
                />
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Amount
                    </span>
                    <input
                        className={`${INPUT_CLASS} w-full text-right`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        autoFocus
                    />
                </label>
                <p className="text-[12px] text-text-3">
                    In drawer now:{' '}
                    <span className="tabular-nums text-text-2">
                        {formatCurrency(drawerCash)}
                    </span>
                </p>
                {overDraw && (
                    <p className="text-sm text-warning">
                        Pay-out exceeds the cash currently in the drawer.
                    </p>
                )}
                <input
                    className={`${INPUT_CLASS} w-full`}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason (optional)"
                    maxLength={255}
                />
                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={recordMovement.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={!canSubmit || recordMovement.isPending}
                    >
                        {recordMovement.isPending ? 'Saving…' : 'Record'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
