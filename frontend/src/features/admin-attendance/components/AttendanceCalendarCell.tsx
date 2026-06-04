import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { IAttendance } from '@/types';
import { AttendanceStatusPill } from './AttendanceStatusPill';
import { formatHoursDuration, isWeekend } from '../lib/attendance-grid-helpers';

interface AttendanceCalendarCellProps {
    /** YYYY-MM-DD, or null for leading/trailing padding cells. */
    date: string | null;
    isToday: boolean;
    isInMonth: boolean;
    employeeName: string;
    row: IAttendance | null;
    onClick: (date: string) => void;
}

function AttendanceCalendarCellImpl({
    date,
    isToday,
    isInMonth,
    employeeName,
    row,
    onClick,
}: AttendanceCalendarCellProps) {
    if (!date) {
        return (
            <td
                aria-hidden="true"
                className="h-[88px] border border-border bg-surface-2/40"
            />
        );
    }

    const day = Number(date.slice(8, 10));
    const status = row?.status ?? (isWeekend(date) ? 'Weekend' : 'Absent');
    const duration = formatHoursDuration(row?.totalHours ?? null);
    const ariaLabel = `Edit attendance for ${employeeName} on ${date}, currently ${status}`;

    return (
        <td className="p-0 border border-border">
            <button
                type="button"
                onClick={() => onClick(date)}
                aria-label={ariaLabel}
                className={cn(
                    'group flex flex-col items-start justify-between w-full h-[88px] px-2 py-1.5 text-left transition-colors',
                    'bg-surface hover:bg-surface-2 focus:outline-none focus:ring-[2px] focus:ring-inset focus:ring-primary/40',
                    !isInMonth && 'bg-surface-2/40 text-text-3 opacity-60',
                    isToday && 'ring-[2px] ring-inset ring-primary/70',
                )}
            >
                <span
                    className={cn(
                        'self-end text-[12px] font-semibold tabular-nums',
                        isToday ? 'text-primary' : 'text-text-2',
                    )}
                >
                    {day}
                </span>
                <div className="flex flex-col items-start gap-1 self-stretch">
                    <AttendanceStatusPill status={status} compact />
                    <span className="text-[11px] text-text-3 tabular-nums">
                        {duration}
                    </span>
                </div>
            </button>
        </td>
    );
}

export const AttendanceCalendarCell = memo(AttendanceCalendarCellImpl);
