import { useMemo } from 'react';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import type { IAttendance, IEmployee } from '@/types';
import {
    formatHoursDuration,
    formatIsoDate,
} from '../lib/attendance-grid-helpers';
import { AttendanceStatusPill } from './AttendanceStatusPill';

interface AttendanceWeekTableProps {
    employees: IEmployee[];
    rows: IAttendance[];
    /** The 7 Mon..Sun ISO dates of the week being shown. */
    days: string[];
    isLoading: boolean;
    onCellClick: (employee: IEmployee, date: string) => void;
}

const WEEKDAY_FMT = new Intl.DateTimeFormat('en-GB', { weekday: 'short' });

function dayHeader(iso: string): { weekday: string; dayNum: number } {
    const [y, m, d] = iso.split('-').map(Number);
    return { weekday: WEEKDAY_FMT.format(new Date(y, m - 1, d)), dayNum: d };
}

function key(employeeId: string, date: string): string {
    return `${employeeId}|${date}`;
}

/**
 * Week overview — one table, one row per employee, a column per day of the
 * selected Mon–Sun week. Each cell shows that day's status and is a button that
 * opens the edit modal (`onCellClick`). A single-week, click-to-edit view; fast
 * Present/Absent marking lives in the Day table.
 */
export function AttendanceWeekTable({
    employees,
    rows,
    days,
    isLoading,
    onCellClick,
}: AttendanceWeekTableProps) {
    const todayIso = useMemo(() => formatIsoDate(new Date()), []);
    const rowByCell = useMemo(() => {
        const map = new Map<string, IAttendance>();
        for (const row of rows) map.set(key(row.employeeId, row.attendanceDate), row);
        return map;
    }, [rows]);

    if (!isLoading && employees.length === 0) {
        return (
            <EmptyState
                title="No staff in this scope"
                description="Pick a branch with staff, or clear the role filter."
            />
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left border-collapse table-fixed">
                <thead>
                    <tr className="text-[11px] uppercase tracking-[0.08em] text-text-3 bg-surface-2 border-y border-border">
                        <th scope="col" className="w-[200px] px-4 py-2.5 font-semibold">
                            Employee
                        </th>
                        {days.map((date) => {
                            const { weekday, dayNum } = dayHeader(date);
                            return (
                                <th
                                    key={date}
                                    scope="col"
                                    className={`px-3 py-2.5 font-semibold ${date === todayIso ? 'text-primary' : ''}`}
                                >
                                    {weekday}
                                    <span className="ml-1.5 text-text-2 font-medium tabular-nums">
                                        {dayNum}
                                    </span>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {isLoading
                        ? [...Array(4)].map((_, r) => (
                              <tr
                                  key={`sk-${r}`}
                                  className="border-b border-border last:border-b-0"
                              >
                                  {[...Array(days.length + 1)].map((__, c) => (
                                      <td key={c} className="px-3 py-3">
                                          <div className="h-10 w-full rounded bg-surface-2 animate-pulse" />
                                      </td>
                                  ))}
                              </tr>
                          ))
                        : employees.map((employee) => (
                              <tr
                                  key={employee.id}
                                  className="border-b border-border last:border-b-0"
                              >
                                  <th
                                      scope="row"
                                      className="px-4 py-3 align-middle font-normal"
                                  >
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
                                  {days.map((date) => {
                                      const row =
                                          rowByCell.get(key(employee.id, date)) ??
                                          null;
                                      return (
                                          <td
                                              key={date}
                                              className={`p-0 align-top border-l border-border ${date === todayIso ? 'bg-primary-soft/10' : ''}`}
                                          >
                                              <button
                                                  type="button"
                                                  onClick={() =>
                                                      onCellClick(employee, date)
                                                  }
                                                  title="Click to mark / edit"
                                                  aria-label={`Edit attendance for ${employee.fullName} on ${date}`}
                                                  className="flex h-full min-h-[64px] w-full cursor-pointer flex-col items-center justify-center gap-1 px-2 py-2.5 text-center transition-colors hover:bg-surface-2 focus:outline-none focus:ring-[2px] focus:ring-inset focus:ring-primary/40"
                                              >
                                                  {row ? (
                                                      <>
                                                          <AttendanceStatusPill
                                                              status={row.status}
                                                          />
                                                          {formatHoursDuration(
                                                              row.totalHours,
                                                          ) !== '—' && (
                                                              <span className="text-[11px] text-text-3 tabular-nums">
                                                                  {formatHoursDuration(
                                                                      row.totalHours,
                                                                  )}
                                                              </span>
                                                          )}
                                                      </>
                                                  ) : (
                                                      <span className="text-[12px] text-text-3">
                                                          —
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
    );
}
