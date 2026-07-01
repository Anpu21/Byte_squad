import { useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { UserRole } from '@/constants/enums';
import { useAuth } from '@/hooks/useAuth';
import { useEmployees } from '@/features/admin-employees';
import { ApplyLeaveModal } from './ApplyLeaveModal';
import { LeavesFilters } from './LeavesFilters';
import { LeavesTable } from './LeavesTable';
import { useLeaves } from '../hooks/useLeaves';
import type { LeaveStatus } from '@/types';

const EMPLOYEE_PAGE_SIZE = 100;

interface LeavesViewProps {
    showHeader?: boolean;
}

/**
 * Shared HR leaves view. Manager/admin see the full branch list with
 * approve/reject actions; cashiers see only their own leaves and can
 * apply or cancel Pending ones (BE pins scope server-side).
 */
export function LeavesView({ showHeader = true }: LeavesViewProps) {
    const { user } = useAuth();
    const role = user?.role;
    const canPickBranch = role === UserRole.ADMIN;
    const canModerate = role === UserRole.ADMIN || role === UserRole.MANAGER;

    const [branchId, setBranchId] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [status, setStatus] = useState<'' | LeaveStatus>('');
    const [applyOpen, setApplyOpen] = useState(false);

    // GET /hr/employees is admin/manager-only — cashiers self-apply
    // without a picker, so skip the fetch entirely for them.
    const employeesQuery = useEmployees(
        {
            branchId: canPickBranch ? branchId || undefined : undefined,
            status: 'Active',
            limit: EMPLOYEE_PAGE_SIZE,
            offset: 0,
        },
        { enabled: canModerate },
    );
    const employees = useMemo(
        () => employeesQuery.data?.rows ?? [],
        [employeesQuery.data],
    );

    // A manager's own leave can only be moderated by an admin — find
    // the manager's employee record so the table mutes approve/reject
    // on it (the BE enforces the same rule with a 403).
    const adminApprovalEmployeeId = useMemo(
        () =>
            role === UserRole.MANAGER
                ? employees.find((e) => e.userId === user?.id)?.id
                : undefined,
        [employees, role, user?.id],
    );

    const leavesQuery = useLeaves({
        branchId: canPickBranch ? branchId || undefined : undefined,
        employeeId: employeeId || undefined,
        status: status || undefined,
        limit: 100,
        offset: 0,
    });
    const rows = leavesQuery.data?.rows ?? [];

    return (
        <>
            {showHeader && (
                <PageHeader
                    actions={
                        <Button
                            variant="primary"
                            onClick={() => setApplyOpen(true)}
                        >
                            Apply for leave
                        </Button>
                    }
                />
            )}
            <Card className="overflow-hidden">
                <LeavesFilters
                    branchId={branchId}
                    onBranchIdChange={setBranchId}
                    employeeId={employeeId}
                    onEmployeeIdChange={setEmployeeId}
                    status={status}
                    onStatusChange={setStatus}
                    canPickBranch={canPickBranch}
                    employees={employees}
                />
                <LeavesTable
                    rows={rows}
                    employees={employees}
                    canModerate={canModerate}
                    canCancel
                    isLoading={leavesQuery.isLoading}
                    adminApprovalEmployeeId={adminApprovalEmployeeId}
                />
            </Card>
            <ApplyLeaveModal
                isOpen={applyOpen}
                onClose={() => setApplyOpen(false)}
                employees={employees}
                hideEmployee={!canModerate}
            />
        </>
    );
}
