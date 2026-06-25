import { useCallback, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { UserRole } from '@/constants/enums';
import { useAuth } from '@/hooks/useAuth';
import { useEmployees } from '@/features/admin-employees/hooks/useEmployees';
import type { IEmployee } from '@/types';
import { useAttendance } from '../hooks/useAttendance';
import { formatIsoDate, weekDates } from '../lib/attendance-grid-helpers';
import { AttendanceFilters } from './AttendanceFilters';
import { AttendanceDayTable } from './AttendanceDayTable';
import { AttendanceWeekTable } from './AttendanceWeekTable';
import { AttendanceEditModal } from './AttendanceEditModal';

const EMPLOYEE_PAGE_SIZE = 100;

type ViewMode = 'day' | 'week';

interface AttendanceViewProps {
    showHeader?: boolean;
}

interface EditingTarget {
    employee: IEmployee;
    date: string;
}

const DATE_LABEL = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
});
const RANGE_LABEL = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
});

function parseIsoToDate(iso: string): Date {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
}

/**
 * Admin / manager attendance workspace with a Day / Week toggle. Day = a single
 * fast roster table for the selected date (Present/Absent + Mark-all). Week =
 * one table of all 7 days (Mon–Sun) for overview + click-to-edit. Both reuse the
 * attendance query (just a 1- or 7-day window) and the edit modal.
 */
export function AttendanceView({ showHeader = true }: AttendanceViewProps) {
    const { user } = useAuth();
    const canPickBranch = user?.role === UserRole.ADMIN;

    const [viewMode, setViewMode] = useState<ViewMode>('day');
    const [selectedDate, setSelectedDate] = useState<string>(() =>
        formatIsoDate(new Date()),
    );
    const [branchId, setBranchId] = useState<string>('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [editingTarget, setEditingTarget] = useState<EditingTarget | null>(
        null,
    );

    const days = useMemo(() => weekDates(selectedDate), [selectedDate]);
    const startDate = viewMode === 'week' ? days[0] : selectedDate;
    const endDate = viewMode === 'week' ? days[6] : selectedDate;

    const employeesQuery = useEmployees({
        branchId: canPickBranch ? branchId || undefined : undefined,
        status: 'Active',
        limit: EMPLOYEE_PAGE_SIZE,
        offset: 0,
    });
    const employees = useMemo(
        () => employeesQuery.data?.rows ?? [],
        [employeesQuery.data],
    );

    // Roster role filter (e.g. "Courier" for workers). Client-side.
    const roleOptions = useMemo(
        () =>
            Array.from(
                new Set(employees.map((e) => e.role).filter(Boolean)),
            ).sort(),
        [employees],
    );
    const activeRole = roleOptions.includes(roleFilter) ? roleFilter : '';
    const visibleEmployees = useMemo(
        () =>
            activeRole
                ? employees.filter((e) => e.role === activeRole)
                : employees,
        [employees, activeRole],
    );

    const attendanceQuery = useAttendance({
        branchId: canPickBranch ? branchId || undefined : undefined,
        startDate,
        endDate,
    });
    const rows = useMemo(
        () => attendanceQuery.data?.rows ?? [],
        [attendanceQuery.data],
    );

    const editingRow = useMemo(() => {
        if (!editingTarget) return null;
        return (
            rows.find(
                (r) =>
                    r.employeeId === editingTarget.employee.id &&
                    r.attendanceDate === editingTarget.date,
            ) ?? null
        );
    }, [editingTarget, rows]);

    const handleEditDay = useCallback(
        (employee: IEmployee) => {
            setEditingTarget({ employee, date: selectedDate });
        },
        [selectedDate],
    );
    const handleCellClick = useCallback((employee: IEmployee, date: string) => {
        setEditingTarget({ employee, date });
    }, []);

    const subtitle =
        viewMode === 'week'
            ? `${RANGE_LABEL.format(parseIsoToDate(days[0]))} – ${RANGE_LABEL.format(parseIsoToDate(days[6]))}. Click any day to mark or edit.`
            : `${DATE_LABEL.format(parseIsoToDate(selectedDate))}. Mark or edit one day at a time.`;

    const isLoading = attendanceQuery.isLoading || employeesQuery.isLoading;

    return (
        <>
            {showHeader && (
                <PageHeader
                    eyebrow="People"
                    title="Attendance"
                    subtitle={subtitle}
                />
            )}
            <Card className="overflow-hidden">
                <AttendanceFilters
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    branchId={branchId}
                    onBranchIdChange={setBranchId}
                    canPickBranch={canPickBranch}
                    roleFilter={activeRole}
                    roleOptions={roleOptions}
                    onRoleChange={setRoleFilter}
                />
                {viewMode === 'week' ? (
                    <AttendanceWeekTable
                        employees={visibleEmployees}
                        rows={rows}
                        days={days}
                        isLoading={isLoading}
                        onCellClick={handleCellClick}
                    />
                ) : (
                    <AttendanceDayTable
                        employees={visibleEmployees}
                        rows={rows}
                        date={selectedDate}
                        isLoading={isLoading}
                        onEdit={handleEditDay}
                    />
                )}
            </Card>

            <AttendanceEditModal
                isOpen={editingTarget !== null}
                onClose={() => setEditingTarget(null)}
                employee={editingTarget?.employee ?? null}
                date={editingTarget?.date ?? null}
                existing={editingRow}
            />
        </>
    );
}
