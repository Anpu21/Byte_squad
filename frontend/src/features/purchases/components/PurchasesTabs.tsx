import {
    Building2,
    CalendarClock,
    ClipboardList,
    FileText,
    PackagePlus,
    Wallet,
    type LucideIcon,
} from 'lucide-react';
import type { PurchasesTab } from '../hooks/usePurchasesTab';

interface TabDef {
    key: PurchasesTab;
    label: string;
    Icon: LucideIcon;
}

const TABS: TabDef[] = [
    { key: 'grns', label: 'Goods receipts', Icon: ClipboardList },
    { key: 'new-grn', label: 'New GRN', Icon: PackagePlus },
    { key: 'orders', label: 'Purchase orders', Icon: FileText },
    { key: 'bills', label: 'Bills & Payments', Icon: Wallet },
    { key: 'ageing', label: 'Ageing', Icon: CalendarClock },
    { key: 'suppliers', label: 'Suppliers', Icon: Building2 },
];

interface PurchasesTabsProps {
    active: PurchasesTab;
    onChange: (tab: PurchasesTab) => void;
}

/** Purchases workspace views — same segmented-tabs idiom as `AdminHrTabs`. */
export function PurchasesTabs({ active, onChange }: PurchasesTabsProps) {
    return (
        <div
            className="flex items-center gap-1 mb-6 p-1 bg-surface-2 rounded-xl border border-border w-fit overflow-x-auto"
            role="tablist"
            aria-label="Purchases workspace views"
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
                        <Icon size={14} strokeWidth={2} aria-hidden />
                        {t.label}
                    </button>
                );
            })}
        </div>
    );
}
