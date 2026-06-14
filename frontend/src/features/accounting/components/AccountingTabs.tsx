import { type LucideIcon } from 'lucide-react';
import type { AccountingTab } from '../hooks/useAccountingTab';

export interface AccountingTabDef {
    key: AccountingTab;
    label: string;
    Icon: LucideIcon;
}

interface AccountingTabsProps {
    tabs: AccountingTabDef[];
    active: AccountingTab;
    onChange: (tab: AccountingTab) => void;
}

export function AccountingTabs({ tabs, active, onChange }: AccountingTabsProps) {
    return (
        <div
            className="flex items-center gap-1 mb-6 p-1 bg-surface-2 rounded-xl border border-border w-fit overflow-x-auto"
            role="tablist"
            aria-label="Accounting workspace views"
        >
            {tabs.map((t) => {
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
