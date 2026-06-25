import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
    Button,
    DataTable,
    EmptyState,
    Pill,
    type DataTableColumn,
} from '@/components/ui';
import { useConfirm } from '@/hooks/useConfirm';
import type { IEmployee, IPayroll } from '@/types';
import {
    useApprovePayroll,
    useCancelPayroll,
} from '../hooks/usePayrollMutations';
import { formatLkr, payrollStatusTone } from '../lib/payroll-formatting';
import { MarkPaidModal } from './MarkPaidModal';

interface IPayrollTableProps {
    rows: IPayroll[];
    employees: IEmployee[];
    isLoading: boolean;
    /** Admin-only: show the approve/mark-paid/cancel actions column. */
    canManage: boolean;
}

/**
 * Owns the inline approve/cancel mutations and the mark-paid modal.
 * A column-aligned totals footer sums gross/deductions/net across the visible
 * page. Managers see the same table read-only (no actions column).
 */
export function PayrollTable({
    rows,
    employees,
    isLoading,
    canManage,
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

    const columns: DataTableColumn<IPayroll>[] = [
        {
            key: 'employee',
            header: 'Employee',
            render: (p) =>
                nameByEmployee.get(p.employeeId) ?? p.employeeId.slice(0, 8),
        },
        {
            key: 'gross',
            header: 'Gross',
            className: 'text-text-2 tabular-nums',
            render: (p) => formatLkr(p.grossSalary),
        },
        {
            key: 'deductions',
            header: 'Deductions',
            className: 'text-text-2 tabular-nums',
            render: (p) => formatLkr(p.totalDeductions),
        },
        {
            key: 'net',
            header: 'Net',
            className: 'text-text-1 font-medium tabular-nums',
            render: (p) => formatLkr(p.netSalary),
        },
        {
            key: 'status',
            header: 'Status',
            render: (p) => (
                <Pill tone={payrollStatusTone(p.paymentStatus)}>
                    {p.paymentStatus}
                </Pill>
            ),
        },
        {
            key: 'paid',
            header: 'Paid',
            className: 'text-text-3 text-[12px]',
            render: (p) => p.paymentDate ?? '—',
        },
        ...(canManage
            ? [
                  {
                      key: 'actions',
                      header: 'Actions',
                      align: 'right',
                      render: (p: IPayroll) => {
                          const status = p.paymentStatus;
                          return (
                              <div className="inline-flex gap-1.5">
                                  {status === 'Pending' && (
                                      <Button
                                          size="sm"
                                          variant="primary"
                                          onClick={() => handleApprove(p.id)}
                                      >
                                          Approve
                                      </Button>
                                  )}
                                  {status === 'Approved' && (
                                      <Button
                                          size="sm"
                                          variant="secondary"
                                          onClick={() => setPaidTarget(p)}
                                      >
                                          Mark paid
                                      </Button>
                                  )}
                                  {(status === 'Pending' ||
                                      status === 'Approved') && (
                                      <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleCancel(p.id)}
                                      >
                                          Cancel
                                      </Button>
                                  )}
                              </div>
                          );
                      },
                  } satisfies DataTableColumn<IPayroll>,
              ]
            : []),
    ];

    const footerRow =
        rows.length > 0 ? (
            <tr className="text-[12px] text-text-2">
                <td className="px-4 py-2.5 font-medium text-text-1">Totals</td>
                <td className="px-4 py-2.5 tabular-nums">
                    {formatLkr(totals.gross)}
                </td>
                <td className="px-4 py-2.5 tabular-nums">
                    {formatLkr(totals.deductions)}
                </td>
                <td className="px-4 py-2.5 tabular-nums font-medium text-text-1">
                    {formatLkr(totals.net)}
                </td>
                <td colSpan={canManage ? 3 : 2} />
            </tr>
        ) : undefined;

    return (
        <>
            <DataTable
                columns={columns}
                rows={rows}
                getRowKey={(p) => p.id}
                isLoading={isLoading}
                zebra
                footerRow={footerRow}
                empty={
                    <EmptyState
                        title="No payroll rows for this period"
                        description="Generate the monthly run to populate the table."
                    />
                }
            />
            {canManage && (
                <MarkPaidModal
                    payroll={paidTarget}
                    onClose={() => setPaidTarget(null)}
                />
            )}
        </>
    );
}
