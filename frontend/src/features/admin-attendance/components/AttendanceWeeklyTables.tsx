import { useMemo } from 'react';
import EmptyState from '@/components/ui/EmptyState';
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
                                    {WEEKDAYS.map((day) => (
                                        <th
                                            key={day.key}
                                            scope="col"
                                            className="px-3 py-2.5 font-semibold"
                                        >
                                            {day.label}
                                        </th>
                                    ))}
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
                                                  className="px-4 py-3 align-top"
                                              >
                                                  <span className="block text-[13px] font-medium text-text-1">
                                                      {employee.fullName}
                                                  </span>
                                                  <span className="block text-[11px] text-text-3 tabular-nums">
                                                      {employee.employeeCode}
                                                  </span>
                                              </th>
                                              {week.map((date, dayIndex) => {
                                                  if (!date) {
                                                      return (
                                                          <td
                                                              key={`pad-${dayIndex}`}
                                                              className="px-3 py-3 align-top bg-surface-2/30 text-text-3"
                                                          >
                                                              <span aria-hidden="true">
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
                                                  const dayNumber = Number(
                                                      date.slice(8, 10),
                                                  );
                                                  const statusLabel =
                                                      attendanceStatusLabel(
                                                          status,
                                                      );

                                                  return (
                                                      <td
                                                          key={date}
                                                          className="p-0 align-top border-l border-border"
                                                      >
                                                          <button
                                                              type="button"
                                                              onClick={() =>
                                                                  onCellClick(
                                                                      employee,
                                                                      date,
                                                                  )
                                                              }
                                                              aria-label={`Edit attendance for ${employee.fullName} on ${date}, currently ${statusLabel}`}
                                                              className={`flex min-h-[78px] w-full flex-col items-start justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-surface-2 focus:outline-none focus:ring-[2px] focus:ring-inset focus:ring-primary/40 ${
                                                                  date ===
                                                                  todayIso
                                                                      ? 'ring-[2px] ring-inset ring-primary/70'
                                                                      : ''
                                                              }`}
                                                          >
                                                              <span className="text-[12px] font-semibold text-text-2 tabular-nums">
                                                                  {dayNumber}
                                                              </span>
                                                              <span className="flex flex-col items-start gap-1">
                                                                  <AttendanceStatusPill
                                                                      status={
                                                                          status
                                                                      }
                                                                  />
                                                                  <span className="text-[11px] text-text-3 tabular-nums">
                                                                      {duration}
                                                                  </span>
                                                              </span>
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
