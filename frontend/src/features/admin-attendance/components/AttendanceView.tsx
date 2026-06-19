import { useCallback, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { UserRole } from '@/constants/enums';
import { useAuth } from '@/hooks/useAuth';
import { useEmployees } from '@/features/admin-employees/hooks/useEmployees';
import type { IEmployee } from '@/types';
import { useAttendance } from '../hooks/useAttendance';
import {
    firstDayOfMonth,
    formatIsoDate,
    formatIsoMonth,
    lastDayOfMonth,
    parseIsoMonth,
} from '../lib/attendance-grid-helpers';
import { AttendanceFilters } from './AttendanceFilters';
import { AttendanceWeeklyTables } from './AttendanceWeeklyTables';
import { AttendanceEditModal } from './AttendanceEditModal';
import { AttendanceTodayBanner } from './AttendanceTodayBanner';

function currentMonthValue(): string {
    const now = new Date();
    return formatIsoMonth(now.getFullYear(), now.getMonth() + 1);
}

const EMPLOYEE_PAGE_SIZE = 100;

interface AttendanceViewProps {
    showHeader?: boolean;
}

interface EditingTarget {
    employee: IEmployee;
    date: string;
}

/**
 * Admin / manager attendance workspace. Renders one Monday-Sunday
 * attendance table per week in the selected month, with one row per
 * employee. Edits live behind a click-to-edit modal and reuse the
 * existing bulk endpoint.
 */
export function AttendanceView({ showHeader = true }: AttendanceViewProps) {
    const { user } = useAuth();
    const canPickBranch = user?.role === UserRole.ADMIN;

    const [monthValue, setMonthValue] = useState<string>(currentMonthValue);
    const [branchId, setBranchId] = useState<string>('');
    const [editingTarget, setEditingTarget] = useState<EditingTarget | null>(
        null,
    );
    const [roleFilter, setRoleFilter] = useState<string>('');

    const { year, month } = parseIsoMonth(monthValue);
    const startDate = useMemo(
        () => firstDayOfMonth(year, month),
        [year, month],
    );
    const endDate = useMemo(() => lastDayOfMonth(year, month), [year, month]);
    const monthLabel = useMemo(
        () =>
            new Intl.DateTimeFormat('en-GB', {
                month: 'long',
                year: 'numeric',
            }).format(new Date(year, month - 1, 1)),
        [year, month],
    );

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

    // Roster role filter (e.g. "Courier" for workers). Client-side — the
    // roster already loads every active employee for the branch.
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

    const handleCellClick = useCallback((employee: IEmployee, date: string) => {
        setEditingTarget({ employee, date });
    }, []);

    // One-click "mark today" from the not-recorded-today banner: open the same
    // edit modal for that employee on today's date.
    const todayIso = useMemo(() => formatIsoDate(new Date()), []);
    const handleMarkToday = useCallback(
        (employeeId: string) => {
            const employee = employees.find((e) => e.id === employeeId);
            if (employee) handleCellClick(employee, todayIso);
        },
        [employees, handleCellClick, todayIso],
    );

    return (
        <>
            {showHeader && (
                <PageHeader
                    eyebrow="People"
                    title="Attendance"
                    subtitle={`${monthLabel}. Click any day to mark or edit attendance.`}
                />
            )}
            <AttendanceTodayBanner
                branchId={canPickBranch ? branchId || undefined : undefined}
                onMark={handleMarkToday}
            />
            <Card className="overflow-hidden">
                <AttendanceFilters
                    monthValue={monthValue}
                    onMonthChange={setMonthValue}
                    branchId={branchId}
                    onBranchIdChange={setBranchId}
                    canPickBranch={canPickBranch}
                    roleFilter={activeRole}
                    roleOptions={roleOptions}
                    onRoleChange={setRoleFilter}
                />
                <AttendanceWeeklyTables
                    employees={visibleEmployees}
                    rows={rows}
                    monthValue={monthValue}
                    isLoading={
                        attendanceQuery.isLoading || employeesQuery.isLoading
                    }
                    onCellClick={handleCellClick}
                />
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
