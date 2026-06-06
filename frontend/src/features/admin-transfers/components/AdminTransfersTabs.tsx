import type { AdminTransfersTab } from '../hooks/useAdminTransfersTab';

interface TabDef {
    key: AdminTransfersTab;
    label: string;
}

const TABS: TabDef[] = [
    { key: 'board', label: 'Pipeline' },
    { key: 'history', label: 'History' },
    { key: 'report', label: 'Report' },
];

interface AdminTransfersTabsProps {
    active: AdminTransfersTab;
    onChange: (tab: AdminTransfersTab) => void;
    boardCount: number;
}

export function AdminTransfersTabs({
    active,
    onChange,
    boardCount,
}: AdminTransfersTabsProps) {
    return (
        <div
            className="flex items-center gap-1 mb-6 p-1 bg-surface-2 rounded-xl border border-border w-fit"
            role="tablist"
            aria-label="Stock transfer views"
        >
            {TABS.map((t) => {
                const isActive = active === t.key;
                const showCount = t.key === 'board';
                return (
                    <button
                        key={t.key}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onChange(t.key)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all focus:outline-none focus:ring-[3px] focus:ring-primary/30 ${
                            isActive
                                ? 'bg-primary text-text-inv shadow-sm'
                                : 'text-text-2 hover:text-text-1 hover:bg-surface-2'
                        }`}
                    >
                        {t.label}
                        {showCount && (
                            <span
                                className={`text-[11px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1.5 ${
                                    isActive
                                        ? 'bg-primary-soft text-primary-soft-text'
                                        : 'bg-surface text-text-3'
                                }`}
                            >
                                {boardCount}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
