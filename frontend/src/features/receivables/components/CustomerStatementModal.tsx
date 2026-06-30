import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Pill from '@/components/ui/Pill';
import {
    DataTable,
    EmptyState,
    FIELD_SHELL,
    FIELD_BORDER,
    type DataTableColumn,
} from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { userService } from '@/services/user.service';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import type { CreditPaymentMethod } from '@/types';
import { useCreditStatement } from '../hooks/useCreditStatement';
import { useReceiveCreditPayment } from '../hooks/useReceiveCreditPayment';
import { useSetCreditLimit } from '../hooks/useSetCreditLimit';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

interface ICustomerStatementModalProps {
    userId: string | null;
    onClose: () => void;
}

type StatementTransaction = NonNullable<
    ReturnType<typeof useCreditStatement>['data']
>['transactions'][number];

const STATEMENT_COLUMNS: DataTableColumn<StatementTransaction>[] = [
    {
        key: 'date',
        header: 'Date',
        className: 'text-[12px] text-text-2 whitespace-nowrap',
        render: (t) => new Date(t.createdAt).toLocaleString(),
    },
    {
        key: 'ref',
        header: 'Ref',
        className: 'text-[12px] text-text-2 mono',
        render: (t) => t.referenceNo,
    },
    {
        key: 'type',
        header: 'Type',
        render: (t) => (
            <Pill
                tone={
                    t.transactionType === 'Credit_Taken' ? 'warning' : 'success'
                }
                dot={false}
            >
                {t.transactionType === 'Credit_Taken' ? 'Taken' : 'Paid'}
            </Pill>
        ),
    },
    {
        key: 'amount',
        header: 'Amount',
        align: 'right',
        numeric: true,
        className: 'text-text-1',
        render: (t) => formatCurrency(Number(t.amount)),
    },
    {
        key: 'balance',
        header: 'Balance',
        align: 'right',
        numeric: true,
        className: 'text-text-2',
        render: (t) => formatCurrency(Number(t.runningBalance)),
    },
];

/**
 * Customer credit statement: running ledger, receive-payment form
 * (FIFO settles oldest invoices server-side), and the credit-limit
 * control. The mirror of a supplier's bills-and-payments view.
 */
export function CustomerStatementModal({
    userId,
    onClose,
}: ICustomerStatementModalProps) {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;
    const statementQuery = useCreditStatement(userId);
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

    const statement = statementQuery.data;
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
        <Modal
            isOpen={userId !== null}
            onClose={onClose}
            title={
                statement
                    ? `${statement.firstName} ${statement.lastName} — statement`
                    : 'Customer statement'
            }
            maxWidth="lg"
        >
            {!statement ? (
                <p className="text-sm text-text-2">Loading…</p>
            ) : (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <Pill
                            tone={
                                statement.currentBalance > 0
                                    ? 'danger'
                                    : 'success'
                            }
                        >
                            Balance {formatCurrency(statement.currentBalance)}
                        </Pill>
                        <Pill tone="neutral">
                            Limit{' '}
                            {statement.creditLimit === null
                                ? 'unlimited'
                                : formatCurrency(statement.creditLimit)}
                        </Pill>
                        {statement.phone && (
                            <span className="text-xs text-text-3">
                                {statement.phone}
                            </span>
                        )}
                    </div>

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
                                setMethod(
                                    e.target.value as CreditPaymentMethod,
                                )
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
                            {receivePayment.isPending
                                ? 'Recording…'
                                : 'Record'}
                        </Button>
                        <span className="text-[11px] text-text-3 basis-full">
                            Oldest unpaid invoices are settled first; any
                            excess stays as store credit.
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
                                    statement.creditLimit === null
                                        ? 'unlimited'
                                        : String(statement.creditLimit)
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
                            onClick={() =>
                                void handleSetLimit(Number(limitDraft))
                            }
                        >
                            Set limit
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            disabled={
                                setLimit.isPending ||
                                statement.creditLimit === null
                            }
                            onClick={() => void handleSetLimit(null)}
                        >
                            Make unlimited
                        </Button>
                    </div>

                    <DataTable
                        columns={STATEMENT_COLUMNS}
                        rows={statement.transactions}
                        getRowKey={(t) => t.id}
                        zebra
                        stickyHeader
                        maxHeight="18rem"
                        empty={<EmptyState title="No credit activity yet." />}
                    />
                </div>
            )}
        </Modal>
    );
}
