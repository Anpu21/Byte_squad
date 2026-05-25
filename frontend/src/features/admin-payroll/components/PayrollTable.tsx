import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import EmptyState from '@/components/ui/EmptyState';
import { useConfirm } from '@/hooks/useConfirm';
import type { IEmployee, IPayroll } from '@/types';
import {
    useApprovePayroll,
    useCancelPayroll,
} from '../hooks/usePayrollMutations';
import { formatLkr } from '../lib/payroll-formatting';
import { MarkPaidModal } from './MarkPaidModal';
import { PayrollTableRow } from './PayrollTableRow';

interface IPayrollTableProps {
    rows: IPayroll[];
    employees: IEmployee[];
    isLoading: boolean;
}

/**
 * Owns the inline approve/cancel mutations and the mark-paid modal.
 * Footer row totals gross/deductions/net across the visible page so
 * the manager has the bank-file totals at a glance.
 */
export function PayrollTable({
    rows,
    employees,
    isLoading,
}: IPayrollTableProps) {
    const confirm = useConfirm();
    const approve = useApprovePayroll();
    const cancel = useCancelPayroll();
    const [paidTarget, setPaidTarget] = useState<IPayroll | null>(null);

    const nameByEmployee = useMemo(() => {
        const map = new Map<string, string>();
        for (const e of employees) {
            map.set(e.id, e.fullName);
        }
        return map;
    }, [employees]);

    const totals = useMemo(() => {
        let gross = 0;
        let deductions = 0;
        let net = 0;
        for (const r of rows) {
            gross += Number(r.grossSalary);
            deductions += Number(r.totalDeductions);
            net += Number(r.netSalary);
        }
        return { gross, deductions, net };
    }, [rows]);

    async function handleApprove(id: string) {
        try {
            await approve.mutateAsync(id);
            toast.success('Payroll approved');
        } catch {
            toast.error('Could not approve payroll');
        }
    }

    async function handleCancel(id: string) {
        const ok = await confirm({
            title: 'Cancel this payroll row?',
            body: 'Pending and Approved rows can be cancelled. This is irreversible.',
            confirmLabel: 'Cancel row',
            tone: 'danger',
        });
        if (!ok) return;
        try {
            await cancel.mutateAsync(id);
            toast.success('Payroll cancelled');
        } catch {
            toast.error('Could not cancel payroll');
        }
    }

    if (!isLoading && rows.length === 0) {
        return (
            <EmptyState
                title="No payroll rows for this period"
                description="Generate the monthly run to populate the table."
            />
        );
    }

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-surface-2/60 border-b border-border">
                        <tr className="text-[11px] uppercase tracking-wide text-text-3">
                            <th className="px-3 py-2.5 font-medium">Employee</th>
                            <th className="px-3 py-2.5 font-medium">Gross</th>
                            <th className="px-3 py-2.5 font-medium">Deductions</th>
                            <th className="px-3 py-2.5 font-medium">Net</th>
                            <th className="px-3 py-2.5 font-medium">Status</th>
                            <th className="px-3 py-2.5 font-medium">Paid</th>
                            <th className="px-3 py-2.5 font-medium text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((p) => (
                            <PayrollTableRow
                                key={p.id}
                                payroll={p}
                                employeeName={
                                    nameByEmployee.get(p.employeeId) ??
                                    p.employeeId.slice(0, 8)
                                }
                                onApprove={handleApprove}
                                onMarkPaid={setPaidTarget}
                                onCancel={handleCancel}
                            />
                        ))}
                    </tbody>
                    {rows.length > 0 ? (
                        <tfoot className="bg-surface-2/40 border-t border-border">
                            <tr className="text-[12px] text-text-2">
                                <td className="px-3 py-2.5 font-medium text-text-1">
                                    Totals
                                </td>
                                <td className="px-3 py-2.5 tabular-nums">
                                    {formatLkr(totals.gross)}
                                </td>
                                <td className="px-3 py-2.5 tabular-nums">
                                    {formatLkr(totals.deductions)}
                                </td>
                                <td className="px-3 py-2.5 tabular-nums font-medium text-text-1">
                                    {formatLkr(totals.net)}
                                </td>
                                <td colSpan={3} />
                            </tr>
                        </tfoot>
                    ) : null}
                </table>
            </div>
            <MarkPaidModal
                payroll={paidTarget}
                onClose={() => setPaidTarget(null)}
            />
        </>
    );
}
