import { useMemo } from 'react';
import { WorkspacePage } from '@/components/ui';
import { useNavTabs } from '@/config/navigation';
import { useTabParam } from '@/hooks/useTabParam';
import { TransactionsPage } from '@/features/transactions';
import { CustomerOrdersPage } from '@/features/customer-orders';
import { DiscountSchemesPage } from '@/features/schemes';
import { SalesmanReportPanel } from '@/features/reports/components/SalesmanReportPanel';

export type SalesTab = 'transactions' | 'orders' | 'schemes' | 'salesman';

/**
 * The Sales hub. Tabs (and their per-role visibility) come from the central
 * navigation config; cashiers see the two till-facing tabs, admins/managers also
 * get discount schemes and the salesman report. The role-filtered key set feeds
 * `useTabParam`, so a role can never deep-link a tab it isn't permitted to see.
 */
export function SalesPage() {
    const tabs = useNavTabs<SalesTab>('sales');
    const allowedKeys = useMemo(() => tabs.map((t) => t.key), [tabs]);

    const { tab, setTab } = useTabParam<SalesTab>({
        valid: allowedKeys,
        fallback: allowedKeys[0] ?? 'transactions',
    });

    return (
        <WorkspacePage
            eyebrow="Revenue"
            title="Sales"
            subtitle="Transactions, customer orders, and schemes — everything that crosses the counter."
            tabs={tabs}
            active={tab}
            onTabChange={setTab}
            tabsAriaLabel="Sales workspace views"
            chromeless
        >
            {tab === 'transactions' && <TransactionsPage />}
            {tab === 'orders' && <CustomerOrdersPage />}
            {tab === 'schemes' && <DiscountSchemesPage />}
            {tab === 'salesman' && <SalesmanReportPanel />}
        </WorkspacePage>
    );
}
