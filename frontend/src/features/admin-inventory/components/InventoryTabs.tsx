import {
    Boxes,
    CalendarClock,
    ClipboardList,
    Truck,
    Undo2,
    type LucideIcon,
} from 'lucide-react';
import type { InventoryTab } from '../hooks/useInventoryTab';

interface TabDef {
    key: InventoryTab;
    label: string;
    Icon: LucideIcon;
}

const TABS: TabDef[] = [
    { key: 'list', label: 'Inventory', Icon: Boxes },
    { key: 'expiry', label: 'Expiry', Icon: CalendarClock },
    { key: 'adjustments', label: 'Adjustments', Icon: ClipboardList },
    { key: 'returns', label: 'Returns', Icon: Undo2 },
    { key: 'transfers', label: 'Transfers', Icon: Truck },
];

interface InventoryTabsProps {
    active: InventoryTab;
    onChange: (tab: InventoryTab) => void;
}

/**
 * Tab strip for the unified Inventory workspace — same pill-bar styling as
 * `AdminHrTabs`. All five tabs show for both Admin and Manager; the per-role
 * content branch lives in the page (admin vs manager Transfers / list).
 */
export function InventoryTabs({ active, onChange }: InventoryTabsProps) {
    return (
        <div
            className="flex items-center gap-1 mb-6 p-1 bg-surface-2 rounded-xl border border-border w-fit overflow-x-auto"
            role="tablist"
            aria-label="Inventory workspace views"
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
