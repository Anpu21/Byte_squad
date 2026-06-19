import { useCallback, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { UserRole } from '@/constants/enums';
import { useAuth } from '@/hooks/useAuth';
import { useEmployees } from '@/features/admin-employees/hooks/useEmployees';
import type { IEmployee } from '@/types';
import { useAttendance } from '../hooks/useAttendance';
import { formatIsoDate } from '../lib/attendance-grid-helpers';
import { AttendanceFilters } from './AttendanceFilters';
import { AttendanceDayTable } from './AttendanceDayTable';
import { AttendanceEditModal } from './AttendanceEditModal';

const EMPLOYEE_PAGE_SIZE = 100;

interface AttendanceViewProps {
    showHeader?: boolean;
}

const DATE_LABEL = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
});

function parseIsoToDate(iso: string): Date {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
}

/**
 * Admin / manager attendance workspace — one table, one day at a time. The day
 * toolbar (Prev / Today / Next + date picker) moves through past records; the
 * table marks the selected day per employee. Edits reuse the bulk endpoint via
 * the day table's quick buttons and the click-to-edit modal.
 */
export function AttendanceView({ showHeader = true }: AttendanceViewProps) {
    const { user } = useAuth();
    const canPickBranch = user?.role === UserRole.ADMIN;

    const [selectedDate, setSelectedDate] = useState<string>(() =>
        formatIsoDate(new Date()),
    );
    const [branchId, setBranchId] = useState<string>('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [editingEmployee, setEditingEmployee] = useState<IEmployee | null>(
        null,
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

    // Roster role filter (e.g. "Courier" for workers). Client-side — the roster
    // already loads every active employee for the branch.
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
        startDate: selectedDate,
        endDate: selectedDate,
    });
    const rows = useMemo(
        () => attendanceQuery.data?.rows ?? [],
        [attendanceQuery.data],
    );

    const editingRow = useMemo(() => {
        if (!editingEmployee) return null;
        return rows.find((r) => r.employeeId === editingEmployee.id) ?? null;
    }, [editingEmployee, rows]);

    const handleEdit = useCallback((employee: IEmployee) => {
        setEditingEmployee(employee);
    }, []);

    const dateLabel = DATE_LABEL.format(parseIsoToDate(selectedDate));

    return (
        <>
            {showHeader && (
                <PageHeader
                    eyebrow="People"
                    title="Attendance"
                    subtitle={`${dateLabel}. Mark or edit one day at a time.`}
                />
            )}
            <Card className="overflow-hidden">
                <AttendanceFilters
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    branchId={branchId}
                    onBranchIdChange={setBranchId}
                    canPickBranch={canPickBranch}
                    roleFilter={activeRole}
                    roleOptions={roleOptions}
                    onRoleChange={setRoleFilter}
                />
                <AttendanceDayTable
                    employees={visibleEmployees}
                    rows={rows}
                    date={selectedDate}
                    isLoading={
                        attendanceQuery.isLoading || employeesQuery.isLoading
                    }
                    onEdit={handleEdit}
                />
            </Card>

            <AttendanceEditModal
                isOpen={editingEmployee !== null}
                onClose={() => setEditingEmployee(null)}
                employee={editingEmployee}
                date={editingEmployee ? selectedDate : null}
                existing={editingRow}
            />
        </>
    );
}
