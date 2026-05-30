import { useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { UserRole } from '@/constants/enums';
import { useAuth } from '@/hooks/useAuth';
import { useEmployees } from '@/features/admin-employees/hooks/useEmployees';
import { ApplyLeaveModal } from '@/features/admin-leaves/components/ApplyLeaveModal';
import { LeavesFilters } from '@/features/admin-leaves/components/LeavesFilters';
import { LeavesTable } from '@/features/admin-leaves/components/LeavesTable';
import { useLeaves } from '@/features/admin-leaves/hooks/useLeaves';
import type { LeaveStatus } from '@/types';

const EMPLOYEE_PAGE_SIZE = 100;

/**
 * Shared HR leaves page. Manager/admin see the full branch list with
 * approve/reject actions; cashiers see only their own leaves and can
 * apply or cancel Pending ones (BE pins scope server-side).
 */
export function AdminLeavesPage() {
    const { user } = useAuth();
    const role = user?.role;
    const canPickBranch = role === UserRole.ADMIN;
    const canModerate = role === UserRole.ADMIN || role === UserRole.MANAGER;

    const [branchId, setBranchId] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [status, setStatus] = useState<'' | LeaveStatus>('');
    const [applyOpen, setApplyOpen] = useState(false);

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

    const leavesQuery = useLeaves({
        branchId: canPickBranch ? branchId || undefined : undefined,
        employeeId: employeeId || undefined,
        status: status || undefined,
        limit: 100,
        offset: 0,
    });
    const rows = leavesQuery.data?.rows ?? [];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                eyebrow="People"
                title="Leaves"
                subtitle={
                    canModerate
                        ? 'Approve, reject, or cancel team leave requests. Annual balances adjust atomically on approve / cancel.'
                        : 'Apply for and review your own leaves. Pending requests can still be cancelled.'
                }
                actions={
                    <Button variant="primary" onClick={() => setApplyOpen(true)}>
                        Apply for leave
                    </Button>
                }
            />
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
                />
            </Card>
            <ApplyLeaveModal
                isOpen={applyOpen}
                onClose={() => setApplyOpen(false)}
                employees={employees}
            />
        </div>
    );
}
