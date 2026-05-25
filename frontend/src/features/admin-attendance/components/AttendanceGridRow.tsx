import { memo } from 'react';
import type { IEmployee } from '@/types';
import {
    STATUS_OPTIONS,
    type IGridCell,
} from '../lib/attendance-grid-helpers';

interface IAttendanceGridRowProps {
    date: string;
    label: string;
    employees: IEmployee[];
    cells: Record<string, IGridCell>;
    onCellChange: (key: string, cell: IGridCell) => void;
}

const CELL_INPUT_CLASS =
    'h-7 w-[78px] px-1.5 bg-surface border border-border rounded text-[11px] text-text-1 outline-none focus:border-primary focus:ring-[2px] focus:ring-primary/20 tabular-nums';
const CELL_SELECT_CLASS =
    'h-7 w-[110px] px-1.5 bg-surface border border-border rounded text-[11px] text-text-1 outline-none focus:border-primary focus:ring-[2px] focus:ring-primary/20';

/**
 * One row of the attendance grid — a single calendar day across all
 * visible employees. Memoised so an edit to one cell only re-renders
 * that day's row, not the entire month.
 */
function AttendanceGridRowImpl({
    date,
    label,
    employees,
    cells,
    onCellChange,
}: IAttendanceGridRowProps) {
    return (
        <tr className="border-b border-border last:border-b-0">
            <th
                scope="row"
                className="px-3 py-2 text-left text-[11px] font-semibold text-text-2 tabular-nums whitespace-nowrap bg-surface-2/40 sticky left-0 z-10"
            >
                {label}
            </th>
            {employees.map((emp) => {
                const key = `${emp.id}|${date}`;
                const cell = cells[key];
                if (!cell) return <td key={key} className="px-3 py-2" />;
                return (
                    <td
                        key={key}
                        className="px-2 py-1.5 border-l border-border align-top"
                    >
                        <div className="flex flex-col gap-1">
                            <select
                                value={cell.status}
                                onChange={(e) =>
                                    onCellChange(key, {
                                        ...cell,
                                        status: e.target
                                            .value as IGridCell['status'],
                                    })
                                }
                                aria-label={`Status for ${emp.fullName} on ${date}`}
                                className={CELL_SELECT_CLASS}
                            >
                                {STATUS_OPTIONS.map((opt) => (
                                    <option
                                        key={opt.value}
                                        value={opt.value}
                                    >
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <div className="flex gap-1">
                                <input
                                    type="time"
                                    value={cell.checkInTime}
                                    onChange={(e) =>
                                        onCellChange(key, {
                                            ...cell,
                                            checkInTime: e.target.value,
                                        })
                                    }
                                    aria-label={`Check-in time for ${emp.fullName} on ${date}`}
                                    className={CELL_INPUT_CLASS}
                                />
                                <input
                                    type="time"
                                    value={cell.checkOutTime}
                                    onChange={(e) =>
                                        onCellChange(key, {
                                            ...cell,
                                            checkOutTime: e.target.value,
                                        })
                                    }
                                    aria-label={`Check-out time for ${emp.fullName} on ${date}`}
                                    className={CELL_INPUT_CLASS}
                                />
                            </div>
                        </div>
                    </td>
                );
            })}
        </tr>
    );
}

export const AttendanceGridRow = memo(AttendanceGridRowImpl);
