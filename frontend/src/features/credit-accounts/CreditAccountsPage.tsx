import { useMemo, useState } from 'react';
import { WorkspacePage } from '@/components/ui';
import Card from '@/components/ui/Card';
import { useNavTabs } from '@/config/navigation';
import type { ICreditAccountRow } from '@/types';
import { useCreditAccounts } from './hooks/useCreditAccounts';
import {
  useCreditAccountsTab,
  type CreditAccountsTab,
} from './hooks/useCreditAccountsTab';
import { CreditAccountsKpis } from './components/CreditAccountsKpis';
import { PendingApprovalsTable } from './components/PendingApprovalsTable';
import { CreditAccountsTable } from './components/CreditAccountsTable';
import { ApproveCreditAccountModal } from './components/ApproveCreditAccountModal';
import { RejectCreditAccountModal } from './components/RejectCreditAccountModal';
import { CreditAccountStatementModal } from './components/CreditAccountStatementModal';

/**
 * The Store-Credit hub (admin/manager). One list query feeds both tabs:
 * Approvals (the PENDING inbox) and Accounts (everything else — balances,
 * ageing KPIs, statements, repayments, and the limit/term + lifecycle controls).
 */
export function CreditAccountsPage() {
  const tabs = useNavTabs<CreditAccountsTab>('credit-accounts');
  const allowedKeys = useMemo(() => tabs.map((t) => t.key), [tabs]);
  const { tab, setTab } = useCreditAccountsTab(allowedKeys);

  const accountsQuery = useCreditAccounts();
  const rows = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const pending = useMemo(
    () => rows.filter((r) => r.status === 'PENDING'),
    [rows],
  );
  const accounts = useMemo(
    () => rows.filter((r) => r.status !== 'PENDING'),
    [rows],
  );

  const [approveRow, setApproveRow] = useState<ICreditAccountRow | null>(null);
  const [rejectRow, setRejectRow] = useState<ICreditAccountRow | null>(null);
  const [statementId, setStatementId] = useState<string | null>(null);

  return (
    <WorkspacePage
      eyebrow="Finance"
      title="Store credit"
      subtitle="Walk-in customer credit accounts (khata) — approvals, balances, ageing, and repayments."
      tabs={tabs}
      active={tab}
      onTabChange={setTab}
      tabsAriaLabel="Credit accounts workspace views"
      chromeless
    >
      {tab === 'approvals' && (
        <Card className="overflow-hidden">
          <PendingApprovalsTable
            rows={pending}
            isLoading={accountsQuery.isLoading}
            onApprove={setApproveRow}
            onReject={setRejectRow}
          />
        </Card>
      )}

      {tab === 'accounts' && (
        <div>
          <CreditAccountsKpis rows={rows} isLoading={accountsQuery.isLoading} />
          <Card className="overflow-hidden">
            <CreditAccountsTable
              rows={accounts}
              isLoading={accountsQuery.isLoading}
              onOpenStatement={(r) => setStatementId(r.id)}
            />
          </Card>
        </div>
      )}

      <ApproveCreditAccountModal
        account={approveRow}
        onClose={() => setApproveRow(null)}
      />
      <RejectCreditAccountModal
        account={rejectRow}
        onClose={() => setRejectRow(null)}
      />
      <CreditAccountStatementModal
        accountId={statementId}
        onClose={() => setStatementId(null)}
      />
    </WorkspacePage>
  );
}
