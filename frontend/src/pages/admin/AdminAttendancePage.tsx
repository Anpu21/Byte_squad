import { useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { UserRole } from '@/constants/enums';
import { useAuth } from '@/hooks/useAuth';
import { useEmployees } from '@/features/admin-employees/hooks/useEmployees';
import { AttendanceFilters } from '@/features/admin-attendance/components/AttendanceFilters';
import { AttendanceGrid } from '@/features/admin-attendance/components/AttendanceGrid';
import {
    formatIsoMonth,
    parseIsoMonth,
} from '@/features/admin-attendance/lib/attendance-grid-helpers';

function currentMonthValue(): string {
    const now = new Date();
    return formatIsoMonth(now.getFullYear(), now.getMonth() + 1);
}

const EMPLOYEE_PAGE_SIZE = 50;

/**
 * Admin / manager attendance editor. Drives the grid through a
 * month picker + branch + employee filter. The grid itself owns the
 * cell buffer and "Save grid" action.
 */
export function AdminAttendancePage() {
    const { user } = useAuth();
    const canPickBranch = user?.role === UserRole.ADMIN;

    const [monthValue, setMonthValue] = useState<string>(currentMonthValue);
    const [branchId, setBranchId] = useState<string>('');
    const [employeeId, setEmployeeId] = useState<string>('');

    const employeesQuery = useEmployees({
        branchId: canPickBranch ? branchId || undefined : undefined,
        status: 'Active',
        limit: EMPLOYEE_PAGE_SIZE,
        offset: 0,
    });
    const allEmployees = useMemo(
        () => employeesQuery.data?.rows ?? [],
        [employeesQuery.data],
    );
    const employees = useMemo(
        () =>
            employeeId
                ? allEmployees.filter((e) => e.id === employeeId)
                : allEmployees,
        [allEmployees, employeeId],
    );

    const { year, month } = parseIsoMonth(monthValue);
    const monthLabel = new Intl.DateTimeFormat('en-GB', {
        month: 'long',
        year: 'numeric',
    }).format(new Date(year, month - 1, 1));

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                eyebrow="People"
                title="Attendance"
                subtitle={`Edit the ${monthLabel} grid. Save once when the month is closed — the BE writes every row in a single transaction.`}
            />
            <Card className="overflow-hidden">
                <AttendanceFilters
                    monthValue={monthValue}
                    onMonthChange={setMonthValue}
                    branchId={branchId}
                    onBranchIdChange={setBranchId}
                    employeeId={employeeId}
                    onEmployeeIdChange={setEmployeeId}
                    canPickBranch={canPickBranch}
                    employees={allEmployees}
                />
                <AttendanceGrid
                    monthValue={monthValue}
                    branchId={branchId}
                    employees={employees}
                    canPickBranch={canPickBranch}
                />
            </Card>
        </div>
    );
}
