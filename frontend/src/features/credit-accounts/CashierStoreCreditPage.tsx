import { useMemo, useState } from 'react';
import { LuSearch as Search, LuUserPlus as UserPlus } from 'react-icons/lu';
import { Button, Input } from '@/components/ui';
import Card from '@/components/ui/Card';
import { useCreditAccounts } from './hooks/useCreditAccounts';
import { CreditAccountsTable } from './components/CreditAccountsTable';
import { CashierCreditStatementModal } from './components/CashierCreditStatementModal';
import { CashierCreditEnrollModal } from './components/CashierCreditEnrollModal';

/**
 * Cashier-facing store-credit ("khata") counter. Lists every credit customer in
 * the cashier's branch (server-scoped) in one table — the search box filters it
 * in place. A row's Statement action opens the balance/ledger + FIFO repayment
 * modal; Enroll customer sends a PENDING request for a manager to approve. A
 * scoped slice of the admin/manager hub (no approvals, limits, or lifecycle).
 */
export function CashierStoreCreditPage() {
  const accountsQuery = useCreditAccounts();
  const rows = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);

  const [query, setQuery] = useState('');
  const [statementId, setStatementId] = useState<string | null>(null);
  const [enrollOpen, setEnrollOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.holderName.toLowerCase().includes(term) ||
        r.phone.toLowerCase().includes(term) ||
        r.accountNo.toLowerCase().includes(term),
    );
  }, [rows, query]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.02em] text-text-1">
            Store credit
          </h1>
          <p className="text-xs text-text-2 mt-1">
            Every credit customer in your branch. Search to find a tab, open a
            statement to take a repayment, or enroll a new walk-in.
          </p>
        </div>
        <Button
          size="lg"
          variant="secondary"
          onClick={() => setEnrollOpen(true)}
        >
          <UserPlus size={16} aria-hidden /> Enroll customer
        </Button>
      </div>

      {/* Search filters the table in place */}
      <div className="mb-4 max-w-sm">
        <Input
          type="search"
          label="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, phone, or account no."
          autoComplete="off"
          leftIcon={<Search size={16} aria-hidden />}
        />
      </div>

      <Card className="overflow-hidden">
        <CreditAccountsTable
          rows={filtered}
          isLoading={accountsQuery.isLoading}
          onOpenStatement={(r) => setStatementId(r.id)}
        />
      </Card>

      <CashierCreditStatementModal
        accountId={statementId}
        onClose={() => setStatementId(null)}
      />
      <CashierCreditEnrollModal
        isOpen={enrollOpen}
        onClose={() => setEnrollOpen(false)}
      />
    </div>
  );
}
