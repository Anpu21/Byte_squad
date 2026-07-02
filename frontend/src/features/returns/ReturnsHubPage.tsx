import { useMemo } from 'react';
import { WorkspacePage } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { useNavTabs } from '@/config/navigation';
import { ReturnsListTab } from './components/ReturnsListTab';
import { ReturnsAnalyticsTab } from './components/ReturnsAnalyticsTab';
import { useReturnsTab, type ReturnsTab } from './hooks/useReturnsTab';

/**
 * Returns hub — a dedicated, role-scoped section. Cashiers see their own
 * returns, managers their branch, admins everything (the API enforces the
 * scope). Sub-tabs live in the sidebar panel, synced via `?tab=`, so the page
 * runs chromeless like the other hubs.
 */
export function ReturnsHubPage() {
    const { user } = useAuth();
    const role = user?.role;
    const tabs = useNavTabs<ReturnsTab>('returns');
    const allowedKeys = useMemo(() => tabs.map((t) => t.key), [tabs]);
    const { tab, setTab } = useReturnsTab(allowedKeys);

    const scope =
        role === UserRole.ADMIN
            ? 'All branches'
            : role === UserRole.CASHIER
              ? 'Your returns'
              : 'Your branch';

    return (
        <WorkspacePage
            eyebrow="Sales"
            title="Returns"
            subtitle={`${scope} · refunds and return history`}
            tabs={tabs}
            active={tab}
            onTabChange={setTab}
            tabsAriaLabel="Returns views"
            chromeless
        >
            {tab === 'analytics' ? <ReturnsAnalyticsTab /> : <ReturnsListTab />}
        </WorkspacePage>
    );
}
