import { TABS, type ScopeTab } from '../hooks/useTransferRequestsPage';

interface TransferScopeTabsProps {
    active: ScopeTab;
    onChange: (tab: ScopeTab) => void;
    myCount: number;
    incomingCount: number;
}

export function TransferScopeTabs({
    active,
    onChange,
    myCount,
    incomingCount,
}: TransferScopeTabsProps) {
    return (
        <div className="flex items-center gap-1 mb-6 p-1 bg-surface-2 rounded-xl border border-border w-fit">
            {TABS.map((t) => {
                const isActive = active === t.key;
                const count = t.key === 'my-requests' ? myCount : incomingCount;
                return (
                    <button
                        key={t.key}
                        onClick={() => onChange(t.key)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                            isActive
                                ? 'bg-primary text-text-inv shadow-sm'
                                : 'text-text-2 hover:text-text-1 hover:bg-surface-2'
                        }`}
                    >
                        {t.label}
                        <span className="text-[11px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-surface-2 text-text-3">
                            {count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
