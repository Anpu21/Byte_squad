import { BadgeCheck, CalendarCheck, CalendarRange, Wallet } from 'lucide-react';
import { Tabs, type TabItem } from '@/components/ui';
import { useAdminHrTab, type AdminHrTab } from './hooks/useAdminHrTab';
import { EmployeesView } from '@/features/admin-employees';
import { AttendanceView } from '@/features/admin-attendance';
import { LeavesView } from '@/features/admin-leaves';
import { PayrollView } from '@/features/admin-payroll';

const TABS: TabItem<AdminHrTab>[] = [
    { key: 'employees', label: 'Employees', Icon: BadgeCheck },
    { key: 'attendance', label: 'Attendance', Icon: CalendarCheck },
    { key: 'leaves', label: 'Leaves', Icon: CalendarRange },
    { key: 'payroll', label: 'Payroll', Icon: Wallet },
];

/**
 * The unified HR workspace (Admin + Manager). A tab hub that composes the four
 * people features; each tab body owns its own data and header.
 */
export function AdminHrPage() {
    const { tab, setTab } = useAdminHrTab();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Tabs
                tabs={TABS}
                active={tab}
                onChange={setTab}
                ariaLabel="HR workspace views"
            />
            {tab === 'employees' && <EmployeesView />}
            {tab === 'attendance' && <AttendanceView />}
            {tab === 'leaves' && <LeavesView />}
            {tab === 'payroll' && <PayrollView />}
        </div>
    );
}
