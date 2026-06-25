import { TABS, type ScopeTab } from '../hooks/useTransferRequestsPage';
import { Tabs, type TabItem } from '@/components/ui/Tabs';

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
    const tabs: TabItem<ScopeTab>[] = TABS.map((t) => ({
        key: t.key,
        label: t.label,
        badge:
            t.key === 'history'
                ? undefined
                : t.key === 'my-requests'
                  ? myCount
                  : incomingCount,
    }));

    return (
        <Tabs
            tabs={tabs}
            active={active}
            onChange={onChange}
            ariaLabel="Stock transfer views"
        />
    );
}
