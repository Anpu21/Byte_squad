import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import type { IPayroll, PaymentMethod } from '@/types';
import { useMarkPayrollPaid } from '../hooks/usePayrollMutations';
import {
    PAYMENT_METHODS,
    formatLkr,
    formatPaymentMethod,
} from '../lib/payroll-formatting';

interface IMarkPaidModalProps {
    payroll: IPayroll | null;
    onClose: () => void;
}

const INPUT_CLASS =
    'h-9 px-3 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-colors';

/**
 * Wrapper that only mounts the form when a payroll row is selected,
 * so each open starts with fresh local state.
 */
export function MarkPaidModal({ payroll, onClose }: IMarkPaidModalProps) {
    return (
        <Modal
            isOpen={payroll !== null}
            onClose={onClose}
            title="Mark payroll as paid"
            maxWidth="md"
            closeOnBackdrop={false}
        >
            {payroll ? <MarkPaidForm payroll={payroll} onClose={onClose} /> : null}
        </Modal>
    );
}

interface IFormProps {
    payroll: IPayroll;
    onClose: () => void;
}

function todayIso(): string {
    return new Date().toISOString().slice(0, 10);
}

function MarkPaidForm({ payroll, onClose }: IFormProps) {
    const markPaid = useMarkPayrollPaid();
    const [paymentDate, setPaymentDate] = useState(todayIso);
    const [paymentMethod, setPaymentMethod] =
        useState<PaymentMethod>('Bank_Transfer');
    const [bankRef, setBankRef] = useState('');

    const needsRef = paymentMethod === 'Bank_Transfer';
    const canSubmit =
        paymentDate.length > 0 && (!needsRef || bankRef.trim().length > 0);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSubmit) return;
        try {
            await markPaid.mutateAsync({
                id: payroll.id,
                payload: {
                    paymentDate,
                    paymentMethod,
                    bankReferenceNo: needsRef ? bankRef.trim() : undefined,
                },
            });
            toast.success('Marked as paid');
            onClose();
        } catch {
            toast.error('Could not mark as paid');
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-[13px] text-text-2">
                Settling{' '}
                <span className="text-text-1 font-medium">
                    {formatLkr(payroll.netSalary)}
                </span>{' '}
                net for this employee. Once marked Paid the row becomes
                immutable.
            </p>
            <label className="block space-y-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Payment date
                </span>
                <input
                    className={`${INPUT_CLASS} w-full`}
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                />
            </label>
            <label className="block space-y-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Method
                </span>
                <select
                    className={`${INPUT_CLASS} w-full`}
                    value={paymentMethod}
                    onChange={(e) =>
                        setPaymentMethod(e.target.value as PaymentMethod)
                    }
                >
                    {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                            {formatPaymentMethod(m)}
                        </option>
                    ))}
                </select>
            </label>
            {needsRef ? (
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Bank reference no
                    </span>
                    <input
                        className={`${INPUT_CLASS} w-full`}
                        value={bankRef}
                        onChange={(e) => setBankRef(e.target.value)}
                        maxLength={100}
                        required
                    />
                </label>
            ) : null}
            <div className="flex justify-end gap-2 pt-1">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    disabled={markPaid.isPending}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    disabled={markPaid.isPending || !canSubmit}
                >
                    {markPaid.isPending ? 'Saving…' : 'Mark paid'}
                </Button>
            </div>
        </form>
    );
}
