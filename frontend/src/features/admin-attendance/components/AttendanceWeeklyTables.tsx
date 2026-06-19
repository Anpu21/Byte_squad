import { useMemo } from 'react';
import { Pencil } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import Avatar from '@/components/ui/Avatar';
import type { AttendanceStatus, IAttendance, IEmployee } from '@/types';
import {
    formatHoursDuration,
    formatIsoDate,
    isWeekend,
    monthWeeks,
    parseIsoMonth,
} from '../lib/attendance-grid-helpers';
import {
    AttendanceStatusPill,
    attendanceStatusLabel,
} from './AttendanceStatusPill';

interface AttendanceWeeklyTablesProps {
    employees: IEmployee[];
    rows: IAttendance[];
    monthValue: string;
    isLoading: boolean;
    onCellClick: (employee: IEmployee, date: string) => void;
}

const WEEKDAYS: ReadonlyArray<{ key: string; label: string }> = [
    { key: 'mon', label: 'Monday' },
    { key: 'tue', label: 'Tuesday' },
    { key: 'wed', label: 'Wednesday' },
    { key: 'thu', label: 'Thursday' },
    { key: 'fri', label: 'Friday' },
    { key: 'sat', label: 'Saturday' },
    { key: 'sun', label: 'Sunday' },
];

const WEEK_RANGE_FORMATTER = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
});

const COLUMN_COUNT = WEEKDAYS.length + 1;

function attendanceKey(employeeId: string, date: string): string {
    return `${employeeId}|${date}`;
}

function parseIsoDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function weekRangeLabel(week: (string | null)[]): string {
    const dates = week.filter((date): date is string => date != null);
    if (dates.length === 0) return '';
    const first = WEEK_RANGE_FORMATTER.format(parseIsoDate(dates[0]));
    const last = WEEK_RANGE_FORMATTER.format(parseIsoDate(dates[dates.length - 1]));
    return first === last ? first : `${first} - ${last}`;
}

function statusForCell(
    row: IAttendance | null,
    date: string,
): AttendanceStatus {
    return row?.status ?? (isWeekend(date) ? 'Weekend' : 'Absent');
}

export function AttendanceWeeklyTables({
    employees,
    rows,
    monthValue,
    isLoading,
    onCellClick,
}: AttendanceWeeklyTablesProps) {
    const { year, month } = parseIsoMonth(monthValue);
    const weeks = useMemo(
        () => monthWeeks(year, month).filter((week) => week.some(Boolean)),
        [year, month],
    );
    const todayIso = useMemo(() => formatIsoDate(new Date()), []);

    const rowsByCell = useMemo(() => {
        const map = new Map<string, IAttendance>();
        for (const row of rows) {
            map.set(attendanceKey(row.employeeId, row.attendanceDate), row);
        }
        return map;
    }, [rows]);

    if (!isLoading && employees.length === 0) {
        return (
            <EmptyState
                title="No employees in this scope"
                description="Pick a branch with staff or invite employees from the People hub before reviewing attendance."
            />
        );
    }

    return (
        <div className="flex flex-col">
            {weeks.map((week, weekIndex) => (
                <section
                    key={`week-${weekIndex}`}
                    aria-label={`Attendance week ${weekIndex + 1}`}
                    className="border-b border-border last:border-b-0"
                >
                    <div className="flex items-center justify-between gap-3 px-5 py-3 bg-surface-2/40">
                        <div className="flex flex-col">
                            <h3 className="text-[13px] font-semibold text-text-1">
                                Week {weekIndex + 1}
                            </h3>
                            <p className="text-[11px] text-text-3 tabular-nums">
                                {weekRangeLabel(week)}
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] text-left border-collapse table-fixed">
                            <thead>
                                <tr className="text-[11px] uppercase tracking-[0.08em] text-text-3 bg-surface-2 border-y border-border">
                                    <th
                                        scope="col"
                                        className="w-[210px] px-4 py-2.5 font-semibold"
                                    >
                                        Employee
                                    </th>
                                    {WEEKDAYS.map((day, dayIndex) => {
                                        const date = week[dayIndex];
                                        const dayNumber = date ? Number(date.slice(8, 10)) : null;
                                        const isWknd = day.key === 'sat' || day.key === 'sun';
                                        return (
                                            <th
                                                key={day.key}
                                                scope="col"
                                                className={`px-3 py-2.5 font-semibold ${isWknd ? 'bg-surface-2/40' : ''}`}
                                            >
                                                {day.label} 
                                                {dayNumber && <span className="text-text-2 font-medium ml-1.5 tabular-nums">{dayNumber}</span>}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading
                                    ? [...Array(4)].map((_, rowIndex) => (
                                          <tr
                                              key={`loading-${rowIndex}`}
                                              className="border-b border-border last:border-b-0"
                                          >
                                              {[...Array(COLUMN_COUNT)].map(
                                                  (__, columnIndex) => (
                                                      <td
                                                          key={columnIndex}
                                                          className="px-3 py-3"
                                                      >
                                                          <div className="h-12 w-full rounded-md bg-surface-2 animate-pulse" />
                                                      </td>
                                                  ),
                                              )}
                                          </tr>
                                      ))
                                    : employees.map((employee) => (
                                          <tr
                                              key={employee.id}
                                              className="border-b border-border last:border-b-0"
                                          >
                                              <th
                                                  scope="row"
                                                  className="px-4 py-3 align-middle"
                                              >
                                                  <div className="flex items-center gap-3">
                                                      <Avatar name={employee.fullName} size={32} />
                                                      <div className="flex flex-col">
                                                          <span className="block text-[13px] font-semibold text-text-1">
                                                              {employee.fullName}
                                                          </span>
                                                          <span className="block text-[11px] text-text-3 tabular-nums mt-0.5">
                                                              {employee.employeeCode}
                                                          </span>
                                                      </div>
                                                  </div>
                                              </th>
                                              {week.map((date, dayIndex) => {
                                                  if (!date) {
                                                      const isWknd = dayIndex === 5 || dayIndex === 6;
                                                      return (
                                                          <td
                                                              key={`pad-${dayIndex}`}
                                                              className={`px-3 py-3 align-top border-l border-border ${isWknd ? 'bg-surface-2/40' : 'bg-surface-2/10'}`}
                                                          >
                                                              <span aria-hidden="true" className="opacity-0">
                                                                  -
                                                              </span>
                                                          </td>
                                                      );
                                                  }

                                                  const row =
                                                      rowsByCell.get(
                                                          attendanceKey(
                                                              employee.id,
                                                              date,
                                                          ),
                                                      ) ?? null;
                                                  const status = statusForCell(
                                                      row,
                                                      date,
                                                  );
                                                  const duration =
                                                      formatHoursDuration(
                                                          row?.totalHours ??
                                                              null,
                                                      );
                                                  const statusLabel =
                                                      attendanceStatusLabel(
                                                          status,
                                                      );
                                                  const isWknd = dayIndex === 5 || dayIndex === 6;

                                                  return (
                                                      <td
                                                          key={date}
                                                          className={`p-0 align-top border-l border-border ${isWknd ? 'bg-surface-2/40' : ''}`}
                                                      >
                                                          <button
                                                              type="button"
                                                              onClick={() =>
                                                                  onCellClick(
                                                                      employee,
                                                                      date,
                                                                  )
                                                              }
                                                              title="Click to mark / edit"
                                                              aria-label={`Edit attendance for ${employee.fullName} on ${date}, currently ${statusLabel}`}
                                                              className={`group relative flex h-full min-h-[76px] w-full cursor-pointer flex-col items-center justify-center gap-1.5 px-2 py-3 text-center transition-colors hover:bg-surface-2 focus:outline-none focus:ring-[2px] focus:ring-inset focus:ring-primary/40 ${
                                                                  date === todayIso
                                                                      ? 'bg-primary-soft/10 ring-[1px] ring-inset ring-primary/40'
                                                                      : ''
                                                              }`}
                                                          >
                                                              <Pencil
                                                                  size={11}
                                                                  aria-hidden
                                                                  className="absolute right-1.5 top-1.5 text-text-3 opacity-0 transition-opacity group-hover:opacity-100"
                                                              />
                                                              <AttendanceStatusPill
                                                                  status={status}
                                                              />
                                                              {duration !== '0h' && (
                                                                  <span className="text-[11px] font-medium text-text-3 tabular-nums">
                                                                      {duration}
                                                                  </span>
                                                              )}
                                                          </button>
                                                      </td>
                                                  );
                                              })}
                                          </tr>
                                      ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            ))}
        </div>
    );
}
