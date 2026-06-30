import { WorkspacePage } from '@/components/ui';
import { useNavTabs } from '@/config/navigation';
import { useAdminHrTab, type AdminHrTab } from './hooks/useAdminHrTab';
import { EmployeesView } from '@/features/admin-employees';
import { AttendanceView } from '@/features/admin-attendance';
import { LeavesView } from '@/features/admin-leaves';
import { PayrollView } from '@/features/admin-payroll';

/**
 * The unified HR workspace (Admin + Manager). A tab hub that composes the four
 * people features; each tab body owns its own data and header. Tabs come from
 * the central navigation config.
 */
export function AdminHrPage() {
    const { tab, setTab } = useAdminHrTab();
    const tabs = useNavTabs<AdminHrTab>('hr');

    return (
        <WorkspacePage
            eyebrow="People"
            title="Human resources"
            subtitle="Employees, attendance, leave, and payroll — your team in one place."
            tabs={tabs}
            active={tab}
            onTabChange={setTab}
            tabsAriaLabel="HR workspace views"
            chromeless
        >
            {tab === 'employees' && <EmployeesView />}
            {tab === 'attendance' && <AttendanceView />}
            {tab === 'leaves' && <LeavesView />}
            {tab === 'payroll' && <PayrollView />}
        </WorkspacePage>
    );
}
