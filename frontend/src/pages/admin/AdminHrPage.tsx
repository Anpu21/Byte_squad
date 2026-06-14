import { BadgeCheck, CalendarCheck, CalendarRange, Wallet } from 'lucide-react';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import {
    useAdminHrTab,
    type AdminHrTab,
} from '@/features/admin-hr/hooks/useAdminHrTab';
import { EmployeesView } from '@/features/admin-employees/components/EmployeesView';
import { AttendanceView } from '@/features/admin-attendance/components/AttendanceView';
import { LeavesView } from '@/features/admin-leaves/components/LeavesView';
import { PayrollView } from '@/features/admin-payroll/components/PayrollView';

const TABS: TabItem<AdminHrTab>[] = [
    { key: 'employees', label: 'Employees', Icon: BadgeCheck },
    { key: 'attendance', label: 'Attendance', Icon: CalendarCheck },
    { key: 'leaves', label: 'Leaves', Icon: CalendarRange },
    { key: 'payroll', label: 'Payroll', Icon: Wallet },
];

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
