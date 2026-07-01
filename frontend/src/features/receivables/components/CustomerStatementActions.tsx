import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { userService } from '@/services/user.service';
import { queryKeys } from '@/lib/queryKeys';
import type { CreditPaymentMethod } from '@/types';
import { useReceiveCreditPayment } from '../hooks/useReceiveCreditPayment';
import { useSetCreditLimit } from '../hooks/useSetCreditLimit';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

interface CustomerStatementActionsProps {
    userId: string | null;
    isAdmin: boolean;
    creditLimit: number | null;
}

/** Receive-payment form (FIFO settles oldest first) + credit-limit controls. */
export function CustomerStatementActions({
    userId,
    isAdmin,
    creditLimit,
}: CustomerStatementActionsProps) {
    const receivePayment = useReceiveCreditPayment();
    const setLimit = useSetCreditLimit();

    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState<CreditPaymentMethod>('Cash');
    const [branchId, setBranchId] = useState('');
    const [limitDraft, setLimitDraft] = useState('');

    const branchesQuery = useQuery({
        queryKey: queryKeys.branches.all(),
        queryFn: userService.getBranches,
        enabled: isAdmin && userId !== null,
    });

    const amountNum = Number(amount);
    const canReceive =
        Number.isFinite(amountNum) &&
        amountNum > 0 &&
        (!isAdmin || branchId.length > 0) &&
        !receivePayment.isPending;

    async function handleReceive(e: React.FormEvent) {
        e.preventDefault();
        if (!userId || !canReceive) return;
        try {
            const updated = await receivePayment.mutateAsync({
                userId,
                payload: {
                    amount: amountNum,
                    method,
                    branchId: isAdmin ? branchId : undefined,
                },
            });
            toast.success(
                `Received ${formatCurrency(amountNum)} — balance ${formatCurrency(updated.currentBalance)}`,
            );
            setAmount('');
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                toast.error(data?.message ?? 'Could not record the payment');
            } else {
                toast.error('Could not record the payment');
            }
        }
    }

    async function handleSetLimit(next: number | null) {
        if (!userId) return;
        try {
            await setLimit.mutateAsync({ userId, creditLimit: next });
            toast.success(
                next === null
                    ? 'Credit limit removed (unlimited)'
                    : `Credit limit set to ${formatCurrency(next)}`,
            );
            setLimitDraft('');
        } catch {
            toast.error('Could not update the credit limit');
        }
    }

    return (
        <>
            <form
                onSubmit={handleReceive}
                className="flex flex-wrap items-end gap-2 p-3 rounded-md border border-border bg-surface-2/40"
            >
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Receive payment
                    </span>
                    <input
                        className={`${INPUT_CLASS} w-32 text-right`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        aria-label="Payment amount"
                    />
                </label>
                <select
                    className={`${INPUT_CLASS} field-select`}
                    value={method}
                    onChange={(e) =>
                        setMethod(e.target.value as CreditPaymentMethod)
                    }
                    aria-label="Payment method"
                >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Bank">Bank transfer</option>
                </select>
                {isAdmin && (
                    <select
                        className={`${INPUT_CLASS} field-select`}
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        aria-label="Receiving branch"
                    >
                        <option value="">Select branch</option>
                        {(branchesQuery.data ?? [])
                            .filter((b) => b.isActive)
                            .map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                    </select>
                )}
                <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!canReceive}
                >
                    {receivePayment.isPending ? 'Recording…' : 'Record'}
                </Button>
                <span className="text-[11px] text-text-3 basis-full">
                    Oldest unpaid invoices are settled first; any excess stays as
                    store credit.
                </span>
            </form>

            <div className="flex items-end gap-2">
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Credit limit
                    </span>
                    <input
                        className={`${INPUT_CLASS} w-36 text-right`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={limitDraft}
                        onChange={(e) => setLimitDraft(e.target.value)}
                        placeholder={
                            creditLimit === null
                                ? 'unlimited'
                                : String(creditLimit)
                        }
                        aria-label="Credit limit"
                    />
                </label>
                <Button
                    size="sm"
                    variant="secondary"
                    disabled={
                        setLimit.isPending ||
                        limitDraft === '' ||
                        Number(limitDraft) < 0
                    }
                    onClick={() => void handleSetLimit(Number(limitDraft))}
                >
                    Set limit
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    disabled={setLimit.isPending || creditLimit === null}
                    onClick={() => void handleSetLimit(null)}
                >
                    Make unlimited
                </Button>
            </div>
        </>
    );
}
