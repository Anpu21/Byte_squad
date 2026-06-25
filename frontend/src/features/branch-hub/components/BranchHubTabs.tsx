import { LuBuilding2 as Building2, LuGitCompareArrows as GitCompareArrows, LuStore as Store } from 'react-icons/lu';
import { type IconType as LucideIcon } from 'react-icons';
import { UserRole } from '@/constants/enums';
import { useAuth } from '@/hooks/useAuth';
import type { BranchHubTab } from '../hooks/useBranchHubTab';

interface TabDef {
    key: BranchHubTab;
    label: string;
    Icon: LucideIcon;
}

interface BranchHubTabsProps {
    active: BranchHubTab;
    onChange: (tab: BranchHubTab) => void;
}

export function BranchHubTabs({ active, onChange }: BranchHubTabsProps) {
    const { user } = useAuth();

    const tabs: TabDef[] = [
        {
            key: 'overview',
            label: user?.role === UserRole.ADMIN ? 'Directory' : 'My Branch',
            Icon: user?.role === UserRole.ADMIN ? Building2 : Store,
        },
        { key: 'compare', label: 'Compare', Icon: GitCompareArrows },
    ];

    return (
        <div
            className="flex items-center gap-1 mb-6 p-1 bg-surface-2 rounded-xl border border-border w-fit overflow-x-auto"
            role="tablist"
            aria-label="Branch hub views"
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
