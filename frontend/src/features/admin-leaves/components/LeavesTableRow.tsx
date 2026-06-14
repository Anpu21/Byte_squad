import Button from '@/components/ui/Button';
import Pill from '@/components/ui/Pill';
import type { ILeave } from '@/types';
import { formatLeaveType, leaveStatusTone } from '../lib/leave-formatting';

interface ILeavesTableRowProps {
    leave: ILeave;
    employeeName: string;
    canModerate: boolean;
    canCancel: boolean;
    /** Manager viewing their own leave — only an admin may moderate it. */
    requiresAdminApproval?: boolean;
    onApprove: (id: string) => void;
    onReject: (leave: ILeave) => void;
    onCancel: (id: string) => void;
}

/**
 * Single row in the leaves table. Action buttons gate on:
 *   - approve/reject: manager/admin + leave is still Pending, unless
 *     the row needs admin approval (a manager's own leave) — then a
 *     muted hint replaces the buttons.
 *   - cancel: actor's role allows it AND the leave isn't already
 *     in a terminal state.
 *
 * The reject flow needs a reason, so the parent owns the modal.
 */
export function LeavesTableRow({
    leave,
    employeeName,
    canModerate,
    canCancel,
    requiresAdminApproval = false,
    onApprove,
    onReject,
    onCancel,
}: ILeavesTableRowProps) {
    const isPending = leave.status === 'Pending';
    const isTerminal =
        leave.status === 'Cancelled' || leave.status === 'Rejected';

    return (
        <tr className="border-b border-border hover:bg-surface-2/40 transition-colors">
            <td className="px-3 py-2.5 text-[13px] text-text-1">
                {employeeName}
            </td>
            <td className="px-3 py-2.5 text-[13px] text-text-2">
                {formatLeaveType(leave.leaveType)}
            </td>
            <td className="px-3 py-2.5 text-[13px] text-text-2 whitespace-nowrap">
                {leave.startDate}
                {leave.startDate !== leave.endDate ? ` → ${leave.endDate}` : ''}
            </td>
            <td className="px-3 py-2.5 text-[13px] text-text-1 tabular-nums">
                {Number(leave.totalDays).toFixed(1)}
            </td>
            <td className="px-3 py-2.5">
                <Pill tone={leaveStatusTone(leave.status)}>{leave.status}</Pill>
            </td>
            <td className="px-3 py-2.5 text-[12px] text-text-3 max-w-[240px] truncate">
                {leave.reason || leave.rejectionReason || '—'}
            </td>
            <td className="px-3 py-2.5 text-right">
                <div className="inline-flex gap-1.5">
                    {canModerate && isPending ? (
                        requiresAdminApproval ? (
                            <Pill tone="neutral" dot={false}>
                                Admin approval
                            </Pill>
                        ) : (
                            <>
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => onApprove(leave.id)}
                                >
                                    Approve
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => onReject(leave)}
                                >
                                    Reject
                                </Button>
                            </>
                        )
                    ) : null}
                    {canCancel && !isTerminal ? (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onCancel(leave.id)}
                        >
                            Cancel
                        </Button>
                    ) : null}
                </div>
            </td>
        </tr>
    );
}

