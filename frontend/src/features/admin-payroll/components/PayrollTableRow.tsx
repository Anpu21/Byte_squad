import Button from '@/components/ui/Button';
import Pill from '@/components/ui/Pill';
import type { IPayroll } from '@/types';
import {
    formatLkr,
    payrollStatusTone,
} from '../lib/payroll-formatting';

interface IPayrollTableRowProps {
    payroll: IPayroll;
    employeeName: string;
    /** Admin-only: render the actions cell (approve / mark-paid / cancel). */
    canManage: boolean;
    onApprove: (id: string) => void;
    onMarkPaid: (payroll: IPayroll) => void;
    onCancel: (id: string) => void;
}

/**
 * One employee × one pay period. Actions gate on the payment-status
 * state machine: Pending → Approve / Cancel, Approved → Mark paid /
 * Cancel, Paid / Cancelled → no actions.
 */
export function PayrollTableRow({
    payroll,
    employeeName,
    canManage,
    onApprove,
    onMarkPaid,
    onCancel,
}: IPayrollTableRowProps) {
    const status = payroll.paymentStatus;
    const canApprove = status === 'Pending';
    const canMarkPaid = status === 'Approved';
    const canCancel = status === 'Pending' || status === 'Approved';

    return (
        <tr className="border-b border-border hover:bg-surface-2/40 transition-colors">
            <td className="px-3 py-2.5 text-[13px] text-text-1">
                {employeeName}
            </td>
            <td className="px-3 py-2.5 text-[13px] text-text-2 tabular-nums">
                {formatLkr(payroll.grossSalary)}
            </td>
            <td className="px-3 py-2.5 text-[13px] text-text-2 tabular-nums">
                {formatLkr(payroll.totalDeductions)}
            </td>
            <td className="px-3 py-2.5 text-[13px] text-text-1 font-medium tabular-nums">
                {formatLkr(payroll.netSalary)}
            </td>
            <td className="px-3 py-2.5">
                <Pill tone={payrollStatusTone(status)}>{status}</Pill>
            </td>
            <td className="px-3 py-2.5 text-[12px] text-text-3">
                {payroll.paymentDate ?? '—'}
            </td>
            {canManage ? (
                <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex gap-1.5">
                        {canApprove ? (
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={() => onApprove(payroll.id)}
                            >
                                Approve
                            </Button>
                        ) : null}
                        {canMarkPaid ? (
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => onMarkPaid(payroll)}
                            >
                                Mark paid
                            </Button>
                        ) : null}
                        {canCancel ? (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onCancel(payroll.id)}
                            >
                                Cancel
                            </Button>
                        ) : null}
                    </div>
                </td>
            ) : null}
        </tr>
    );
}
