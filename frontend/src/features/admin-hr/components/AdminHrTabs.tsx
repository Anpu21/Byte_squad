import {
    BadgeCheck,
    CalendarCheck,
    CalendarRange,
    Wallet,
    type LucideIcon,
} from 'lucide-react';
import type { AdminHrTab } from '../hooks/useAdminHrTab';

interface TabDef {
    key: AdminHrTab;
    label: string;
    Icon: LucideIcon;
}

const TABS: TabDef[] = [
    { key: 'employees', label: 'Employees', Icon: BadgeCheck },
    { key: 'attendance', label: 'Attendance', Icon: CalendarCheck },
    { key: 'leaves', label: 'Leaves', Icon: CalendarRange },
    { key: 'payroll', label: 'Payroll', Icon: Wallet },
];

interface AdminHrTabsProps {
    active: AdminHrTab;
    onChange: (tab: AdminHrTab) => void;
}

export function AdminHrTabs({ active, onChange }: AdminHrTabsProps) {
    return (
        <div
            className="flex items-center gap-1 mb-6 p-1 bg-surface-2 rounded-xl border border-border w-fit overflow-x-auto"
            role="tablist"
            aria-label="HR workspace views"
        >
            {TABS.map((t) => {
                const isActive = active === t.key;
                const { Icon } = t;
                return (
                    <button
                        key={t.key}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onChange(t.key)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap focus:outline-none focus:ring-[3px] focus:ring-primary/30 ${
                            isActive
                                ? 'bg-primary text-text-inv shadow-sm'
                                : 'text-text-2 hover:text-text-1 hover:bg-surface-2'
                        }`}
                    >
                        <Icon size={14} strokeWidth={2} />
                        {t.label}
                    </button>
                );
            })}
        </div>
    );
}
