import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { LuCircleCheckBig as CheckCircle2, LuPencil as Pencil } from 'react-icons/lu';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import type {
    AttendanceStatus,
    IAttendance,
    IBulkAttendanceRow,
    IEmployee,
} from '@/types';
import { useBulkUpsertAttendance } from '../hooks/useBulkUpsertAttendance';
import { AttendanceStatusPill } from './AttendanceStatusPill';

interface AttendanceDayTableProps {
    employees: IEmployee[];
    rows: IAttendance[];
    date: string;
    isLoading: boolean;
    onEdit: (employee: IEmployee) => void;
}

const TH = 'px-4 py-2.5 font-semibold';
const TD = 'px-4 py-3 align-middle';

const QUICK_BTN =
    'px-2 py-0.5 rounded-md bg-surface border border-border text-[11px] font-medium text-text-1 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

/** Inline hours editor — commits a 0–24 value on blur / Enter. */
function HoursCell({
    initial,
    disabled,
    onCommit,
}: {
    initial: number | null;
    disabled: boolean;
    onCommit: (hours: number) => void;
}) {
    const [text, setText] = useState(initial == null ? '' : String(initial));

    function commit() {
        const trimmed = text.trim();
        if (trimmed === '') return;
        const n = Number(trimmed);
        if (!Number.isFinite(n) || n <= 0 || n > 24 || n === initial) return;
        onCommit(n);
    }

    return (
        <input
            type="text"
            inputMode="decimal"
            value={text}
            disabled={disabled}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            aria-label="Hours"
            placeholder="—"
            className="w-16 h-7 px-2 text-right text-[12px] tabular-nums bg-surface border border-border rounded outline-none focus:border-primary focus:ring-[2px] focus:ring-primary/30 transition-colors disabled:opacity-60"
        />
    );
}

/**
 * One table, one day — Employee · Status · Hours · Mark. Hours is editable
 * inline (commit on blur/Enter → marks the person Present with those hours, no
 * popup needed). Present / Absent quick buttons + an edit button for the rarer
 * statuses, plus a "Mark all present" header action. All writes go through the
 * bulk endpoint, which invalidates the hr query family so the table refreshes.
 */
export function AttendanceDayTable({
    employees,
    rows,
    date,
    isLoading,
    onEdit,
}: AttendanceDayTableProps) {
    const bulk = useBulkUpsertAttendance();

    const rowByEmployee = useMemo(() => {
        const map = new Map<string, IAttendance>();
        for (const row of rows) map.set(row.employeeId, row);
        return map;
    }, [rows]);

    const recordedCount = useMemo(
        () => employees.filter((e) => rowByEmployee.has(e.id)).length,
        [employees, rowByEmployee],
    );

    function save(payloadRows: IBulkAttendanceRow[], successLabel: string) {
        if (payloadRows.length === 0) return;
        bulk.mutate(
            { rows: payloadRows },
            {
                onSuccess: () => toast.success(successLabel),
                onError: () =>
                    toast.error('Could not save attendance - please retry'),
            },
        );
    }

    function markOne(employeeId: string, status: AttendanceStatus) {
        save([{ employeeId, attendanceDate: date, status }], 'Attendance saved');
    }

    function markHours(
        employeeId: string,
        current: AttendanceStatus | null,
        hours: number,
    ) {
        // Typing hours implies they worked — keep an existing Present/Half-day
        // status, otherwise default to Present.
        const status: AttendanceStatus =
            current === 'Present' || current === 'Half_Day'
                ? current
                : 'Present';
        save(
            [{ employeeId, attendanceDate: date, status, totalHours: hours }],
            'Hours saved',
        );
    }

    function markAllPresent() {
        save(
            employees.map((e) => ({
                employeeId: e.id,
                attendanceDate: date,
                status: 'Present' as AttendanceStatus,
            })),
            'Marked all present',
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border bg-surface-2/40 flex-wrap">
                <p className="text-[12px] text-text-2">
                    <span className="font-semibold text-text-1 tabular-nums">
                        {recordedCount}
                    </span>{' '}
                    of <span className="tabular-nums">{employees.length}</span>{' '}
                    recorded
                </p>
                <button
                    type="button"
                    onClick={markAllPresent}
                    disabled={bulk.isPending || employees.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-text-inv text-[12px] font-semibold hover:bg-primary/90 transition-colors focus:outline-none focus:ring-[2px] focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <CheckCircle2 size={14} aria-hidden />
                    Mark all present
                </button>
            </div>

            {!isLoading && employees.length === 0 ? (
                <EmptyState
                    title="No staff in this scope"
                    description="Pick a branch with staff, or clear the role filter."
                />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left border-collapse">
                        <thead>
                            <tr className="text-[11px] uppercase tracking-[0.08em] text-text-3 bg-surface-2 border-y border-border">
                                <th scope="col" className={TH}>
                                    Employee
                                </th>
                                <th scope="col" className={TH}>
                                    Status
                                </th>
                                <th scope="col" className={TH}>
                                    Hours
                                </th>
                                <th scope="col" className={`${TH} text-right`}>
                                    Mark
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading
                                ? [...Array(4)].map((_, i) => (
                                      <tr
                                          key={`sk-${i}`}
                                          className="border-b border-border last:border-b-0"
                                      >
                                          {[...Array(4)].map((__, j) => (
                                              <td key={j} className="px-4 py-3">
                                                  <div className="h-6 w-full rounded bg-surface-2 animate-pulse" />
                                              </td>
                                          ))}
                                      </tr>
                                  ))
                                : employees.map((employee) => {
                                      const row =
                                          rowByEmployee.get(employee.id) ?? null;
                                      return (
                                          <tr
                                              key={employee.id}
                                              className="border-b border-border last:border-b-0 hover:bg-surface-2/40"
                                          >
                                              <th
                                                  scope="row"
                                                  className={`${TD} font-normal`}
                                              >
                                                  <div className="flex items-center gap-3">
                                                      <Avatar
                                                          name={
                                                              employee.fullName
                                                          }
                                                          size={32}
                                                      />
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
                                                      <AttendanceStatusPill
                                                          status={row.status}
                                                      />
                                                  ) : (
                                                      <span className="text-[12px] text-text-3">
                                                          Not marked
                                                      </span>
                                                  )}
                                              </td>
                                              <td className={TD}>
                                                  <HoursCell
                                                      key={`h-${employee.id}-${row?.totalHours ?? ''}`}
                                                      initial={
                                                          row?.totalHours ?? null
                                                      }
                                                      disabled={bulk.isPending}
                                                      onCommit={(h) =>
                                                          markHours(
                                                              employee.id,
                                                              row?.status ??
                                                                  null,
                                                              h,
                                                          )
                                                      }
                                                  />
                                              </td>
                                              <td className={TD}>
                                                  <div className="flex items-center justify-end gap-1.5">
                                                      <button
                                                          type="button"
                                                          onClick={() =>
                                                              markOne(
                                                                  employee.id,
                                                                  'Present',
                                                              )
                                                          }
                                                          disabled={
                                                              bulk.isPending
                                                          }
                                                          className={`${QUICK_BTN} hover:border-primary hover:bg-primary-soft/30 focus:ring-[2px] focus:ring-primary/40`}
                                                      >
                                                          Present
                                                      </button>
                                                      <button
                                                          type="button"
                                                          onClick={() =>
                                                              markOne(
                                                                  employee.id,
                                                                  'Absent',
                                                              )
                                                          }
                                                          disabled={
                                                              bulk.isPending
                                                          }
                                                          className={`${QUICK_BTN} hover:border-danger hover:bg-danger-soft/40 focus:ring-[2px] focus:ring-danger/40`}
                                                      >
                                                          Absent
                                                      </button>
                                                      <button
                                                          type="button"
                                                          onClick={() =>
                                                              onEdit(employee)
                                                          }
                                                          aria-label={`Edit ${employee.fullName}`}
                                                          title="Other status (Leave / Holiday…)"
                                                          className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border bg-surface text-text-3 hover:text-text-1 hover:bg-surface-2 transition-colors focus:outline-none focus:ring-[2px] focus:ring-primary/40"
                                                      >
                                                          <Pencil
                                                              size={13}
                                                              aria-hidden
                                                          />
                                                      </button>
                                                  </div>
                                              </td>
                                          </tr>
                                      );
                                  })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
