import { Building2, Check, Trash2, XCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Pill from '@/components/ui/Pill';
import StatusPill from '@/components/ui/StatusPill';
import { ExpenseStatus } from '@/constants/enums';
import type { IExpense } from '@/types';
import { formatCurrencyWhole } from '../lib/format';

interface ExpenseRowProps {
    expense: IExpense;
    isAdmin: boolean;
    currentUserBranchId: string | null | undefined;
    showBranch: boolean;
    branchLabel: (id: string) => string;
    onApprove: (expense: IExpense) => void;
    onReject: (expense: IExpense) => void;
    onDelete: (id: string) => void;
}

export function ExpenseRow({
    expense,
    isAdmin,
    currentUserBranchId,
    showBranch,
    branchLabel,
    onApprove,
    onReject,
    onDelete,
}: ExpenseRowProps) {
    const date = new Date(expense.expenseDate);
    const day = date.toLocaleDateString('en-GB', { day: '2-digit' });
    const mon = date.toLocaleDateString('en-GB', { month: 'short' });
    const isPending = expense.status === ExpenseStatus.PENDING;
    const branchName = expense.branch?.name ?? branchLabel(expense.branchId);
    const canDelete =
        isAdmin || (isPending && expense.branchId === currentUserBranchId);

    return (
        <Card className="group p-4 hover:border-border-strong hover:bg-surface-2 transition-colors">
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-center w-12 flex-shrink-0">
                    <span className="mono text-lg font-semibold text-text-1 leading-none">
                        {day}
                    </span>
                    <span className="text-[11px] uppercase tracking-widest text-text-3 mt-1">
                        {mon}
                    </span>
                </div>
                <div className="flex-shrink-0">
                    <Pill tone="neutral" dot={false}>
                        {expense.category}
                    </Pill>
                </div>
                <div className="flex-shrink-0">
                    <StatusPill status={expense.status} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-1 truncate">
                        {expense.description}
                    </p>
                    {showBranch && (
                        <p className="text-[11px] text-text-3 mt-0.5 inline-flex items-center gap-1">
                            <Building2 size={10} />
                            {branchName}
                        </p>
                    )}
                </div>
                <p className="mono text-base font-semibold text-text-1 whitespace-nowrap">
                    {formatCurrencyWhole(Number(expense.amount))}
                </p>

                <div className="flex items-center gap-1 flex-shrink-0">
                    {isAdmin && isPending && (
                        <>
                            <button
                                type="button"
                                onClick={() => onApprove(expense)}
                                className="p-1.5 text-text-3 hover:text-accent-text opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all rounded-md hover:bg-accent-soft"
                                title="Approve"
                                aria-label="Approve"
                            >
                                <Check size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => onReject(expense)}
                                className="p-1.5 text-text-3 hover:text-danger opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all rounded-md hover:bg-danger-soft"
                                title="Reject"
                                aria-label="Reject"
                            >
                                <XCircle size={14} />
                            </button>
                        </>
                    )}
                    {canDelete && (
                        <button
                            type="button"
                            onClick={() => onDelete(expense.id)}
                            className="p-1.5 text-text-3 hover:text-danger opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all rounded-md hover:bg-danger-soft"
                            title="Delete"
                            aria-label="Delete"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
            {expense.reviewNote && (
                <p className="mt-2 ml-16 text-[12px] text-text-3 italic">
                    Note: {expense.reviewNote}
                </p>
            )}
        </Card>
    );
}
