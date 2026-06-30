import { LuPencil as Pencil } from 'react-icons/lu';
import Avatar from '@/components/ui/Avatar';
import type { AttendanceStatus, IAttendance, IEmployee } from '@/types';
import { AttendanceStatusPill } from './AttendanceStatusPill';
import { AttendanceHoursCell } from './AttendanceHoursCell';

const TD = 'px-4 py-3 align-middle';
const QUICK_BTN =
    'px-2 py-0.5 rounded-md bg-surface border border-border text-[11px] font-medium text-text-1 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

interface AttendanceDayRowProps {
    employee: IEmployee;
    row: IAttendance | null;
    disabled: boolean;
    onMark: (employeeId: string, status: AttendanceStatus) => void;
    onMarkHours: (
        employeeId: string,
        current: AttendanceStatus | null,
        hours: number,
    ) => void;
    onEdit: (employee: IEmployee) => void;
}

/** One employee's attendance row: identity, status, inline hours, quick marks. */
export function AttendanceDayRow({
    employee,
    row,
    disabled,
    onMark,
    onMarkHours,
    onEdit,
}: AttendanceDayRowProps) {
    return (
        <tr className="border-b border-border last:border-b-0 hover:bg-surface-2/40">
            <th scope="row" className={`${TD} font-normal`}>
                <div className="flex items-center gap-3">
                    <Avatar name={employee.fullName} size={32} />
                    <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-text-1">
                            {employee.fullName}
                        </span>
                        <span className="text-[11px] text-text-3">
                            {employee.role}
                        </span>
                    </div>
                </div>
            </th>
            <td className={TD}>
                {row ? (
                    <AttendanceStatusPill status={row.status} />
                ) : (
                    <span className="text-[12px] text-text-3">Not marked</span>
                )}
            </td>
            <td className={TD}>
                <AttendanceHoursCell
                    key={`h-${employee.id}-${row?.totalHours ?? ''}`}
                    initial={row?.totalHours ?? null}
                    disabled={disabled}
                    onCommit={(h) => onMarkHours(employee.id, row?.status ?? null, h)}
                />
            </td>
            <td className={TD}>
                <div className="flex items-center justify-end gap-1.5">
                    <button
                        type="button"
                        onClick={() => onMark(employee.id, 'Present')}
                        disabled={disabled}
                        className={`${QUICK_BTN} hover:border-primary hover:bg-primary-soft/30 focus:ring-[2px] focus:ring-primary/40`}
                    >
                        Present
                    </button>
                    <button
                        type="button"
                        onClick={() => onMark(employee.id, 'Absent')}
                        disabled={disabled}
                        className={`${QUICK_BTN} hover:border-danger hover:bg-danger-soft/40 focus:ring-[2px] focus:ring-danger/40`}
                    >
                        Absent
                    </button>
                    <button
                        type="button"
                        onClick={() => onEdit(employee)}
                        aria-label={`Edit ${employee.fullName}`}
                        title="Other status (Leave / Holiday…)"
                        className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border bg-surface text-text-3 hover:text-text-1 hover:bg-surface-2 transition-colors focus:outline-none focus:ring-[2px] focus:ring-primary/40"
                    >
                        <Pencil size={13} aria-hidden />
                    </button>
                </div>
            </td>
        </tr>
    );
}
