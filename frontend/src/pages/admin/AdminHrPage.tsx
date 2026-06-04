import { AdminHrTabs } from '@/features/admin-hr/components/AdminHrTabs';
import { useAdminHrTab } from '@/features/admin-hr/hooks/useAdminHrTab';
import { EmployeesView } from '@/features/admin-employees/components/EmployeesView';
import { AttendanceView } from '@/features/admin-attendance/components/AttendanceView';
import { LeavesView } from '@/features/admin-leaves/components/LeavesView';
import { PayrollView } from '@/features/admin-payroll/components/PayrollView';

export function AdminHrPage() {
    const { tab, setTab } = useAdminHrTab();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AdminHrTabs active={tab} onChange={setTab} />
            {tab === 'employees' && <EmployeesView />}
            {tab === 'attendance' && <AttendanceView />}
            {tab === 'leaves' && <LeavesView />}
            {tab === 'payroll' && <PayrollView />}
        </div>
    );
}
