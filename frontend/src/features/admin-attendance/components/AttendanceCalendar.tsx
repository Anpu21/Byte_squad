import { useMemo } from 'react';
import type { AttendanceStatus, IAttendance, IEmployee } from '@/types';
import {
    formatHoursDuration,
    formatIsoDate,
    monthWeeks,
    parseIsoMonth,
} from '../lib/attendance-grid-helpers';
import { AttendanceCalendarCell } from './AttendanceCalendarCell';

interface AttendanceCalendarProps {
    employee: IEmployee;
    monthValue: string;
    rows: IAttendance[];
    onCellClick: (date: string) => void;
}

const WEEKDAYS: ReadonlyArray<{ key: string; label: string }> = [
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
    { key: 'fri', label: 'Fri' },
    { key: 'sat', label: 'Sat' },
    { key: 'sun', label: 'Sun' },
];

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
});

const COUNTABLE_STATUSES: AttendanceStatus[] = [
    'Present',
    'Absent',
    'Half_Day',
    'Leave',
    'Holiday',
];

const STATUS_SHORT: Record<AttendanceStatus, string> = {
    Present: 'Present',
    Absent: 'Absent',
    Half_Day: 'Half day',
    Leave: 'Leave',
    Holiday: 'Holiday',
    Weekend: 'Weekend',
};

export function AttendanceCalendar({
    employee,
    monthValue,
    rows,
    onCellClick,
}: AttendanceCalendarProps) {
    const { year, month } = parseIsoMonth(monthValue);
    const weeks = useMemo(() => monthWeeks(year, month), [year, month]);
    const monthLabel = useMemo(
        () => MONTH_LABEL_FORMATTER.format(new Date(year, month - 1, 1)),
        [year, month],
    );
    const todayIso = useMemo(() => formatIsoDate(new Date()), []);

    const rowsByDate = useMemo(() => {
        const map = new Map<string, IAttendance>();
        for (const r of rows) {
            if (r.employeeId === employee.id) {
                map.set(r.attendanceDate, r);
            }
        }
        return map;
    }, [rows, employee.id]);

    const summary = useMemo(() => {
        const counts: Record<AttendanceStatus, number> = {
            Present: 0,
            Absent: 0,
            Half_Day: 0,
            Leave: 0,
            Holiday: 0,
            Weekend: 0,
        };
        let totalHours = 0;
        for (const r of rowsByDate.values()) {
            counts[r.status] += 1;
            if (r.totalHours) totalHours += r.totalHours;
        }
        return { counts, totalHours };
    }, [rowsByDate]);

    return (
        <div className="flex flex-col">
            <div className="flex flex-wrap items-baseline justify-between gap-3 px-5 py-3 border-b border-border bg-surface-2/40">
                <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-text-1">
                        {employee.fullName}
                    </span>
                    <span className="text-[11px] text-text-3 tabular-nums">
                        {employee.employeeCode} · {monthLabel}
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-2">
                    {COUNTABLE_STATUSES.map((s) => (
                        <span key={s} className="tabular-nums">
                            <span className="text-text-3">
                                {STATUS_SHORT[s]}
                            </span>{' '}
                            <span className="font-semibold text-text-1">
                                {summary.counts[s]}
                            </span>
                        </span>
                    ))}
                    <span className="tabular-nums">
                        <span className="text-text-3">Hours</span>{' '}
                        <span className="font-semibold text-text-1">
                            {formatHoursDuration(summary.totalHours)}
                        </span>
                    </span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse table-fixed">
                    <thead>
                        <tr>
                            {WEEKDAYS.map((d) => (
                                <th
                                    key={d.key}
                                    scope="col"
                                    className="w-[14.285%] px-2 py-2 text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold bg-surface-2 border border-border"
                                >
                                    {d.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {weeks.map((week, wi) => (
                            <tr key={wi}>
                                {week.map((date, di) => (
                                    <AttendanceCalendarCell
                                        key={date ?? `pad-${wi}-${di}`}
                                        date={date}
                                        isInMonth={date != null}
                                        isToday={date === todayIso}
                                        employeeName={employee.fullName}
                                        row={date ? (rowsByDate.get(date) ?? null) : null}
                                        onClick={onCellClick}
                                    />
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
