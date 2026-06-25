import { useMemo } from 'react';
import { LuScrollText as ScrollText, LuHandCoins as HandCoins, LuScale as Scale, LuWallet as Wallet, LuPiggyBank as PiggyBank } from 'react-icons/lu';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { WorkspacePage, type TabItem } from '@/components/ui';
import {
    useAccountingTab,
    type AccountingTab,
} from '@/features/accounting/hooks/useAccountingTab';
import { LedgerPage } from '@/features/ledger';
import { ReceivablesPage } from '@/features/receivables';
import { FinancialReportsPage } from '@/features/financial-reports';
import { ExpensesPage } from '@/features/expenses';
import { ProfitLossPage } from '@/features/profit-loss';

interface AccountingTabConfig extends TabItem<AccountingTab> {
    roles: UserRole[];
}

/**
 * Single source of truth for the accounting hub — each tab's label, icon, the
 * roles allowed to see it, and (below) the page it renders. Mirrors the HR
 * workspace pattern (`AdminHrPage`), with per-tab role gating layered on top.
 */
const TABS: AccountingTabConfig[] = [
    {
        key: 'ledger',
        label: 'Ledger',
        Icon: ScrollText,
        roles: [UserRole.ADMIN],
    },
    {
        key: 'receivables',
        label: 'Receivables',
        Icon: HandCoins,
        roles: [UserRole.ADMIN, UserRole.MANAGER],
    },
    {
        key: 'reports',
        label: 'Financial reports',
        Icon: Scale,
        roles: [UserRole.ADMIN],
    },
    {
        key: 'expenses',
        label: 'Expenses',
        Icon: Wallet,
        roles: [UserRole.ADMIN, UserRole.MANAGER],
    },
    {
        key: 'profit-loss',
        label: 'Profit & Loss',
        Icon: PiggyBank,
        roles: [UserRole.ADMIN],
    },
];

export function AccountingPage() {
    const { user } = useAuth();
    const role = user?.role as UserRole | undefined;

    const allowedTabs = useMemo<AccountingTabConfig[]>(
        () => (role ? TABS.filter((t) => t.roles.includes(role)) : []),
        [role],
    );
    const allowedKeys = useMemo<AccountingTab[]>(
        () => allowedTabs.map((t) => t.key),
        [allowedTabs],
    );

    const { tab, setTab } = useAccountingTab(allowedKeys);

    return (
        <WorkspacePage
            eyebrow="Finance"
            title="Accounting"
            subtitle="Ledger, receivables, expenses, and the P&L — the books behind every branch."
            tabs={allowedTabs}
            active={tab}
            onTabChange={setTab}
            tabsAriaLabel="Accounting workspace views"
        >
            {tab === 'ledger' && <LedgerPage />}
            {tab === 'receivables' && <ReceivablesPage />}
            {tab === 'reports' && <FinancialReportsPage embedded />}
            {tab === 'expenses' && <ExpensesPage />}
            {tab === 'profit-loss' && <ProfitLossPage />}
        </WorkspacePage>
    );
}
