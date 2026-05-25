import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import type { IEmployee } from '@/types';
import { useAttendance } from '../hooks/useAttendance';
import { useBulkUpsertAttendance } from '../hooks/useBulkUpsertAttendance';
import {
    buildBulkPayload,
    firstDayOfMonth,
    lastDayOfMonth,
    monthDays,
    parseIsoMonth,
    seedGridCells,
    type IGridCell,
} from '../lib/attendance-grid-helpers';
import { AttendanceGridRow } from './AttendanceGridRow';

interface IAttendanceGridProps {
    monthValue: string;
    branchId: string;
    employees: IEmployee[];
    canPickBranch: boolean;
}

const SHORT_DAY_FORMATTER = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
});

function formatDayLabel(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    return SHORT_DAY_FORMATTER.format(new Date(y, m - 1, d));
}

/**
 * Manager attendance editor — rows are days, columns are employees.
 * Edits live in local state until "Save grid" fires a single bulk
 * upsert. The grid only re-seeds when the source rows or the
 * (year/month, branch, employee) filter changes, so typing into a
 * cell never wipes the rest of the buffer.
 */
export function AttendanceGrid({
    monthValue,
    branchId,
    employees,
    canPickBranch,
}: IAttendanceGridProps) {
    const { year, month } = parseIsoMonth(monthValue);
    const startDate = useMemo(() => firstDayOfMonth(year, month), [year, month]);
    const endDate = useMemo(() => lastDayOfMonth(year, month), [year, month]);
    const days = useMemo(() => monthDays(year, month), [year, month]);

    const attendanceQuery = useAttendance({
        branchId: canPickBranch ? branchId || undefined : undefined,
        startDate,
        endDate,
    });

    const employeeIds = useMemo(() => employees.map((e) => e.id), [employees]);
    const rows = useMemo(
        () => attendanceQuery.data?.rows ?? [],
        [attendanceQuery.data],
    );
    const seeded = useMemo(
        () => seedGridCells(employeeIds, days, rows),
        [employeeIds, days, rows],
    );

    const [cells, setCells] = useState<Record<string, IGridCell>>(seeded);
    const [original, setOriginal] = useState<Record<string, IGridCell>>(seeded);

    useEffect(() => {
        setCells(seeded);
        setOriginal(seeded);
    }, [seeded]);

    const handleCellChange = useCallback(
        (key: string, cell: IGridCell) => {
            setCells((prev) => ({ ...prev, [key]: cell }));
        },
        [],
    );

    const bulkMutation = useBulkUpsertAttendance();

    const dirtyCount = useMemo(
        () => buildBulkPayload(cells, original).length,
        [cells, original],
    );

    async function handleSave() {
        const payload = buildBulkPayload(cells, original);
        if (payload.length === 0) {
            toast('Nothing to save', { icon: 'i' });
            return;
        }
        if (payload.length > 500) {
            toast.error(
                'Too many changes in one save (>500). Narrow the filter and try again.',
            );
            return;
        }
        try {
            await bulkMutation.mutateAsync({ rows: payload });
            toast.success(`Saved ${payload.length} attendance entries`);
        } catch {
            toast.error('Could not save attendance — please retry');
        }
    }

    if (employees.length === 0) {
        return (
            <EmptyState
                title="No employees in this scope"
                description="Pick a branch with staff or invite employees from the People hub before recording attendance."
            />
        );
    }

    return (
        <div className="flex flex-col">
            <div className="overflow-x-auto">
                <table className="min-w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[11px] uppercase tracking-[0.08em] text-text-3 bg-surface-2 border-b border-border">
                            <th className="px-3 py-2.5 font-semibold sticky left-0 bg-surface-2 z-20">
                                Date
                            </th>
                            {employees.map((emp) => (
                                <th
                                    key={emp.id}
                                    className="px-2 py-2.5 font-semibold border-l border-border whitespace-nowrap"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-[12px] normal-case tracking-normal text-text-1">
                                            {emp.fullName}
                                        </span>
                                        <span className="text-[10px] text-text-3 tabular-nums">
                                            {emp.employeeCode}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {days.map((d) => (
                            <AttendanceGridRow
                                key={d}
                                date={d}
                                label={formatDayLabel(d)}
                                employees={employees}
                                cells={cells}
                                onCellChange={handleCellChange}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border bg-surface-2/40">
                <p className="text-[12px] text-text-3 tabular-nums">
                    {dirtyCount === 0
                        ? 'No unsaved changes'
                        : `${dirtyCount} pending change${dirtyCount === 1 ? '' : 's'}`}
                </p>
                <Button
                    type="button"
                    size="md"
                    onClick={handleSave}
                    disabled={
                        bulkMutation.isPending || attendanceQuery.isLoading
                    }
                >
                    {bulkMutation.isPending ? 'Saving…' : 'Save grid'}
                </Button>
            </div>
        </div>
    );
}
