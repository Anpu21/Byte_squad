import { useMemo } from 'react';
import { LuChevronRight as ChevronRight } from 'react-icons/lu';
import EmptyState from '@/components/ui/EmptyState';
import type { AttendanceStatus, IAttendance, IEmployee } from '@/types';
import { formatHoursDuration } from '../lib/attendance-grid-helpers';

interface AttendanceRosterTableProps {
    employees: IEmployee[];
    rows: IAttendance[];
    isLoading: boolean;
    onEmployeeSelect: (employeeId: string) => void;
}

interface RosterTotals {
    Present: number;
    Absent: number;
    Half_Day: number;
    Leave: number;
    Holiday: number;
    Weekend: number;
    totalHours: number;
}

function emptyTotals(): RosterTotals {
    return {
        Present: 0,
        Absent: 0,
        Half_Day: 0,
        Leave: 0,
        Holiday: 0,
        Weekend: 0,
        totalHours: 0,
    };
}

const COLUMN_COUNT = 8;

export function AttendanceRosterTable({
    employees,
    rows,
    isLoading,
    onEmployeeSelect,
}: AttendanceRosterTableProps) {
    const aggregates = useMemo(() => {
        const out = new Map<string, RosterTotals>();
        for (const emp of employees) out.set(emp.id, emptyTotals());
        for (const r of rows) {
            const bucket = out.get(r.employeeId);
            if (!bucket) continue;
            bucket[r.status as AttendanceStatus] += 1;
            if (r.totalHours) bucket.totalHours += r.totalHours;
        }
        return out;
    }, [employees, rows]);

    if (!isLoading && employees.length === 0) {
        return (
            <EmptyState
                title="No employees in this scope"
                description="Pick a branch with staff or invite employees from the People hub before reviewing attendance."
            />
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-[11px] uppercase tracking-[0.08em] text-text-3 bg-surface-2 border-b border-border">
                        <th className="px-4 py-2.5 font-semibold">Employee</th>
                        <th className="px-3 py-2.5 font-semibold text-right tabular-nums">
                            Pres
                        </th>
                        <th className="px-3 py-2.5 font-semibold text-right tabular-nums">
                            Abs
                        </th>
                        <th className="px-3 py-2.5 font-semibold text-right tabular-nums">
                            Half
                        </th>
                        <th className="px-3 py-2.5 font-semibold text-right tabular-nums">
                            Leave
                        </th>
                        <th className="px-3 py-2.5 font-semibold text-right tabular-nums">
                            Hol
                        </th>
                        <th className="px-3 py-2.5 font-semibold text-right tabular-nums">
                            Hours
                        </th>
                        <th className="px-3 py-2.5" aria-hidden="true" />
                    </tr>
                </thead>
                <tbody>
                    {isLoading
                        ? [...Array(4)].map((_, i) => (
                              <tr key={i} className="border-b border-border">
                                  {[...Array(COLUMN_COUNT)].map((__, j) => (
                                      <td key={j} className="px-3 py-3">
                                          <div className="h-4 w-16 bg-surface-2 rounded animate-pulse" />
                                      </td>
                                  ))}
                              </tr>
                          ))
                        : employees.map((emp) => {
                              const t = aggregates.get(emp.id) ?? emptyTotals();
                              return (
                                  <tr
                                      key={emp.id}
                                      className="border-b border-border last:border-b-0 hover:bg-surface-2/60 transition-colors cursor-pointer group"
                                      onClick={() => onEmployeeSelect(emp.id)}
                                  >
                                      <td className="px-4 py-3">
                                          <div className="flex flex-col">
                                              <button
                                                  type="button"
                                                  onClick={(e) => {
                                                      e.stopPropagation();
                                                      onEmployeeSelect(emp.id);
                                                  }}
                                                  className="text-left text-[13px] font-medium text-text-1 hover:text-primary focus:outline-none focus:text-primary"
                                              >
                                                  {emp.fullName}
                                              </button>
                                              <span className="text-[11px] text-text-3 tabular-nums">
                                                  {emp.employeeCode}
                                              </span>
                                          </div>
                                      </td>
                                      <td className="px-3 py-3 text-right tabular-nums text-text-1 font-medium">
                                          {t.Present}
                                      </td>
                                      <td className="px-3 py-3 text-right tabular-nums text-text-1 font-medium">
                                          {t.Absent}
                                      </td>
                                      <td className="px-3 py-3 text-right tabular-nums text-text-1 font-medium">
                                          {t.Half_Day}
                                      </td>
                                      <td className="px-3 py-3 text-right tabular-nums text-text-1 font-medium">
                                          {t.Leave}
                                      </td>
                                      <td className="px-3 py-3 text-right tabular-nums text-text-1 font-medium">
                                          {t.Holiday}
                                      </td>
                                      <td className="px-3 py-3 text-right tabular-nums text-text-1 font-medium">
                                          {formatHoursDuration(t.totalHours)}
                                      </td>
                                      <td className="px-3 py-3 text-right">
                                          <ChevronRight
                                              size={14}
                                              className="text-text-3 group-hover:text-text-1 transition-colors"
                                          />
                                      </td>
                                  </tr>
                              );
                          })}
                </tbody>
            </table>
        </div>
    );
}
