import { useCallback, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { UserRole } from '@/constants/enums';
import { useAuth } from '@/hooks/useAuth';
import { useEmployees } from '@/features/admin-employees/hooks/useEmployees';
import { useAttendance } from '../hooks/useAttendance';
import {
    firstDayOfMonth,
    formatIsoMonth,
    lastDayOfMonth,
    parseIsoMonth,
} from '../lib/attendance-grid-helpers';
import { AttendanceFilters } from './AttendanceFilters';
import { AttendanceCalendar } from './AttendanceCalendar';
import { AttendanceRosterTable } from './AttendanceRosterTable';
import { AttendanceEditModal } from './AttendanceEditModal';

function currentMonthValue(): string {
    const now = new Date();
    return formatIsoMonth(now.getFullYear(), now.getMonth() + 1);
}

const EMPLOYEE_PAGE_SIZE = 100;

interface AttendanceViewProps {
    showHeader?: boolean;
}

/**
 * Admin / manager attendance workspace. Drives a Mon-Sun calendar
 * for a single employee, or a roster summary when none is picked.
 * Edits live behind a click-to-edit modal that targets one cell at
 * a time and reuses the existing bulk endpoint.
 */
export function AttendanceView({ showHeader = true }: AttendanceViewProps) {
    const { user } = useAuth();
    const canPickBranch = user?.role === UserRole.ADMIN;

    const [monthValue, setMonthValue] = useState<string>(currentMonthValue);
    const [branchId, setBranchId] = useState<string>('');
    const [employeeId, setEmployeeId] = useState<string>('');
    const [editingDate, setEditingDate] = useState<string | null>(null);

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

    const attendanceQuery = useAttendance({
        branchId: canPickBranch ? branchId || undefined : undefined,
        employeeId: employeeId || undefined,
        startDate,
        endDate,
    });
    const rows = useMemo(
        () => attendanceQuery.data?.rows ?? [],
        [attendanceQuery.data],
    );

    const selectedEmployee = useMemo(
        () => employees.find((e) => e.id === employeeId) ?? null,
        [employees, employeeId],
    );
    const editingRow = useMemo(() => {
        if (!editingDate || !selectedEmployee) return null;
        return (
            rows.find(
                (r) =>
                    r.employeeId === selectedEmployee.id &&
                    r.attendanceDate === editingDate,
            ) ?? null
        );
    }, [editingDate, selectedEmployee, rows]);

    const handleCellClick = useCallback((date: string) => {
        setEditingDate(date);
    }, []);

    return (
        <>
            {showHeader && (
                <PageHeader
                    eyebrow="People"
                    title="Attendance"
                    subtitle={
                        selectedEmployee
                            ? `${selectedEmployee.fullName} — ${monthLabel}.`
                            : `${monthLabel}. Pick an employee to open their calendar, or review the roster summary below.`
                    }
                />
            )}
            <Card className="overflow-hidden">
                <AttendanceFilters
                    monthValue={monthValue}
                    onMonthChange={setMonthValue}
                    branchId={branchId}
                    onBranchIdChange={setBranchId}
                    employeeId={employeeId}
                    onEmployeeIdChange={setEmployeeId}
                    canPickBranch={canPickBranch}
                    employees={employees}
                />
                {selectedEmployee ? (
                    <AttendanceCalendar
                        employee={selectedEmployee}
                        monthValue={monthValue}
                        rows={rows}
                        onCellClick={handleCellClick}
                    />
                ) : (
                    <AttendanceRosterTable
                        employees={employees}
                        rows={rows}
                        isLoading={
                            attendanceQuery.isLoading ||
                            employeesQuery.isLoading
                        }
                        onEmployeeSelect={setEmployeeId}
                    />
                )}
            </Card>

            <AttendanceEditModal
                isOpen={editingDate !== null}
                onClose={() => setEditingDate(null)}
                employee={selectedEmployee}
                date={editingDate}
                existing={editingRow}
            />
        </>
    );
}
