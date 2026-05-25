import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import EmptyState from '@/components/ui/EmptyState';
import { useConfirm } from '@/hooks/useConfirm';
import type { IEmployee, ILeave } from '@/types';
import { useApproveLeave } from '../hooks/useApproveLeave';
import { useCancelLeave } from '../hooks/useCancelLeave';
import { LeavesTableRow } from './LeavesTableRow';
import { RejectLeaveModal } from './RejectLeaveModal';

interface ILeavesTableProps {
    rows: ILeave[];
    employees: IEmployee[];
    canModerate: boolean;
    canCancel: boolean;
    isLoading: boolean;
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
        } catch {
            toast.error('Could not approve leave');
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

    if (!isLoading && rows.length === 0) {
        return (
            <EmptyState
                title="No leaves found"
                description="Try widening the filters above, or apply a new leave to get started."
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
                            <th className="px-3 py-2.5 font-medium">Type</th>
                            <th className="px-3 py-2.5 font-medium">Dates</th>
                            <th className="px-3 py-2.5 font-medium">Days</th>
                            <th className="px-3 py-2.5 font-medium">Status</th>
                            <th className="px-3 py-2.5 font-medium">Reason</th>
                            <th className="px-3 py-2.5 font-medium text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((leave) => (
                            <LeavesTableRow
                                key={leave.id}
                                leave={leave}
                                employeeName={
                                    nameByEmployee.get(leave.employeeId) ??
                                    leave.employeeId.slice(0, 8)
                                }
                                canModerate={canModerate}
                                canCancel={canCancel}
                                onApprove={handleApprove}
                                onReject={setRejectTarget}
                                onCancel={handleCancel}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
            <RejectLeaveModal
                leave={rejectTarget}
                onClose={() => setRejectTarget(null)}
            />
        </>
    );
}
