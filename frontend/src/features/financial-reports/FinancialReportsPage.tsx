import { useNavTabs } from '@/config/navigation';
import { WorkspacePage } from '@/components/ui';
import { useTabParam } from '@/hooks/useTabParam';
import { REPORT_TABS, type ReportTab } from './financial-reports.lib';
import { TrialBalanceTab } from './components/TrialBalanceTab';
import { BalanceSheetTab } from './components/BalanceSheetTab';
import { DayBookTab } from './components/DayBookTab';
import { PeriodLocksTab } from './components/PeriodLocksTab';

/**
 * The three classic statements over the account-dimensioned ledger — trial
 * balance (with the books' equality check), balance sheet (with virtual
 * retained earnings), and the day book, plus month-end period locks. Each tab
 * owns its own query + filters; this shell just wires the sticky sub-nav.
 * Admin only.
 */
interface FinancialReportsPageProps {
    /** Rendered inside the Accounting hub's "reports" tab → no header/sticky band. */
    embedded?: boolean;
}

export function FinancialReportsPage({
    embedded = false,
}: FinancialReportsPageProps = {}) {
    const tabs = useNavTabs<ReportTab>('financial-reports');
    const { tab, setTab } = useTabParam<ReportTab>({
        valid: REPORT_TABS,
        fallback: 'trial-balance',
        param: 'reportTab',
    });

    return (
        <WorkspacePage
            embedded={embedded}
            eyebrow="Accounting"
            title="Financial reports"
            subtitle="Trial balance, balance sheet, and the day book — straight off the account-dimensioned ledger."
            tabs={tabs}
            active={tab}
            onTabChange={setTab}
            tabsAriaLabel="Financial report views"
        >
            {tab === 'trial-balance' && <TrialBalanceTab />}
            {tab === 'balance-sheet' && <BalanceSheetTab />}
            {tab === 'day-book' && <DayBookTab />}
            {tab === 'periods' && <PeriodLocksTab />}
        </WorkspacePage>
    );
}
