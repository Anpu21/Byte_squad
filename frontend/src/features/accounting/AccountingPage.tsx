import { useMemo } from 'react';
import { WorkspacePage } from '@/components/ui';
import { useNavTabs } from '@/config/navigation';
import {
    useAccountingTab,
    type AccountingTab,
} from '@/features/accounting/hooks/useAccountingTab';
import { LedgerPage } from '@/features/ledger';
import { ReceivablesPage } from '@/features/receivables';
import { FinancialReportsPage } from '@/features/financial-reports';
import { ExpensesPage } from '@/features/expenses';
import { ProfitLossPage } from '@/features/profit-loss';

/**
 * The Accounting hub. Tabs and their per-role visibility come from the central
 * navigation config (ledger / financial reports / P&L are admin-only); the
 * role-filtered key set feeds `useAccountingTab` so a manager can't deep-link a
 * tab they can't see. Each tab renders the existing feature page.
 */
export function AccountingPage() {
    const tabs = useNavTabs<AccountingTab>('accounting');
    const allowedKeys = useMemo(() => tabs.map((t) => t.key), [tabs]);

    const { tab, setTab } = useAccountingTab(allowedKeys);

    return (
        <WorkspacePage
            eyebrow="Finance"
            title="Accounting"
            subtitle="Ledger, receivables, expenses, and the P&L — the books behind every branch."
            tabs={tabs}
            active={tab}
            onTabChange={setTab}
            tabsAriaLabel="Accounting workspace views"
            chromeless
        >
            {tab === 'ledger' && <LedgerPage />}
            {tab === 'receivables' && <ReceivablesPage />}
            {tab === 'reports' && <FinancialReportsPage embedded />}
            {tab === 'expenses' && <ExpensesPage />}
            {tab === 'profit-loss' && <ProfitLossPage />}
        </WorkspacePage>
    );
}
