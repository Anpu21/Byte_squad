import { useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    Button,
    DataTable,
    EmptyState,
    Pill,
    type DataTableColumn,
} from '@/components/ui';
import { useConfirm } from '@/hooks/useConfirm';
import type { IEmployee, ILeave } from '@/types';
import { useApproveLeave } from '../hooks/useApproveLeave';
import { useCancelLeave } from '../hooks/useCancelLeave';
import { RejectLeaveModal } from './RejectLeaveModal';
import { formatLeaveType, leaveStatusTone } from '../lib/leave-formatting';

interface ILeavesTableProps {
    rows: ILeave[];
    employees: IEmployee[];
    canModerate: boolean;
    canCancel: boolean;
    isLoading: boolean;
    /**
     * Employee whose pending leaves only an admin may moderate —
     * the acting manager's own record. Rows for it swap the
     * approve/reject buttons for an "Admin approval" hint.
     */
    adminApprovalEmployeeId?: string;
}

/**
 * Table view of the leaves list. Owns the inline approve mutation,
 * the reject modal (needs a reason), and the cancel-confirm flow.
 * Errors surface via toast; the parent only needs to feed rows.
 */
export function LeavesTable({
    rows,
    employees,
    canModerate,
    canCancel,
    isLoading,
    adminApprovalEmployeeId,
}: ILeavesTableProps) {
    const confirm = useConfirm();
    const approve = useApproveLeave();
    const cancel = useCancelLeave();
    const [rejectTarget, setRejectTarget] = useState<ILeave | null>(null);

    const nameByEmployee = useMemo(() => {
        const map = new Map<string, string>();
        for (const e of employees) {
            map.set(e.id, e.fullName);
        }
        return map;
    }, [employees]);

    async function handleApprove(id: string) {
        try {
            await approve.mutateAsync(id);
            toast.success('Leave approved');
        } catch (err: unknown) {
            // Surface BE rule violations verbatim (e.g. "Manager
            // leaves require admin approval").
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                toast.error(data?.message ?? 'Could not approve leave');
            } else {
                toast.error('Could not approve leave');
            }
        }
    }

    async function handleCancel(id: string) {
        const ok = await confirm({
            title: 'Cancel this leave?',
            body: 'This is irreversible. If the leave was Approved and Annual, the balance will be reverted.',
            confirmLabel: 'Cancel leave',
            tone: 'danger',
        });
        if (!ok) return;
        try {
            await cancel.mutateAsync(id);
            toast.success('Leave cancelled');
        } catch {
            toast.error('Could not cancel leave');
        }
    }

    const columns: DataTableColumn<ILeave>[] = [
        {
            key: 'employee',
            header: 'Employee',
            render: (leave) =>
                nameByEmployee.get(leave.employeeId) ??
                leave.employeeId.slice(0, 8),
        },
        {
            key: 'type',
            header: 'Type',
            className: 'text-text-2',
            render: (leave) => formatLeaveType(leave.leaveType),
        },
        {
            key: 'dates',
            header: 'Dates',
            className: 'text-text-2 whitespace-nowrap',
            render: (leave) =>
                `${leave.startDate}${
                    leave.startDate !== leave.endDate
                        ? ` → ${leave.endDate}`
                        : ''
                }`,
        },
        {
            key: 'days',
            header: 'Days',
            className: 'tabular-nums',
            render: (leave) => Number(leave.totalDays).toFixed(1),
        },
        {
            key: 'status',
            header: 'Status',
            render: (leave) => (
                <Pill tone={leaveStatusTone(leave.status)}>{leave.status}</Pill>
            ),
        },
        {
            key: 'reason',
            header: 'Reason',
            className: 'text-text-3 text-[12px] max-w-[240px] truncate',
            render: (leave) =>
                leave.reason || leave.rejectionReason || '—',
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (leave) => {
                const isPending = leave.status === 'Pending';
                const isTerminal =
                    leave.status === 'Cancelled' ||
                    leave.status === 'Rejected';
                const requiresAdminApproval =
                    leave.employeeId === adminApprovalEmployeeId;
                return (
                    <div className="inline-flex gap-1.5">
                        {canModerate && isPending
                            ? requiresAdminApproval
                                ? (
                                      <Pill tone="neutral" dot={false}>
                                          Admin approval
                                      </Pill>
                                  )
                                : (
                                      <>
                                          <Button
                                              size="sm"
                                              variant="primary"
                                              onClick={() =>
                                                  handleApprove(leave.id)
                                              }
                                          >
                                              Approve
                                          </Button>
                                          <Button
                                              size="sm"
                                              variant="secondary"
                                              onClick={() =>
                                                  setRejectTarget(leave)
                                              }
                                          >
                                              Reject
                                          </Button>
                                      </>
                                  )
                            : null}
                        {canCancel && !isTerminal ? (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCancel(leave.id)}
                            >
                                Cancel
                            </Button>
                        ) : null}
                    </div>
                );
            },
        },
    ];

    return (
        <>
            <DataTable
                columns={columns}
                rows={rows}
                getRowKey={(leave) => leave.id}
                isLoading={isLoading}
                zebra
                empty={
                    <EmptyState
                        title="No leaves found"
                        description="Try widening the filters above, or apply a new leave to get started."
                    />
                }
            />
            <RejectLeaveModal
                leave={rejectTarget}
                onClose={() => setRejectTarget(null)}
            />
        </>
    );
}
