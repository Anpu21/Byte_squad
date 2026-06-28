import {
  LuWallet as Wallet,
  LuTriangleAlert as AlertTriangle,
  LuUsers as Users,
  LuInbox as Inbox,
} from 'react-icons/lu';
import KpiCard from '@/components/ui/KpiCard';
import { formatCurrency } from '@/lib/utils';
import type { ICreditAccountRow } from '@/types';

interface CreditAccountsKpisProps {
  rows: ICreditAccountRow[];
  isLoading: boolean;
}

/** Headline numbers for the credit book: exposure, overdue, and account counts. */
export function CreditAccountsKpis({ rows, isLoading }: CreditAccountsKpisProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-md shadow-xs p-5 h-[104px] animate-pulse"
          />
        ))}
      </div>
    );
  }

  const outstanding = rows.reduce((sum, r) => sum + r.ageing.outstandingTotal, 0);
  const overdue = rows.reduce((sum, r) => sum + r.ageing.overdueTotal, 0);
  const activeCount = rows.filter((r) => r.status === 'ACTIVE').length;
  const pendingCount = rows.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <KpiCard
        label="Outstanding"
        value={formatCurrency(outstanding)}
        note="Owed across all accounts"
        accent="primary"
        icon={<Wallet size={14} />}
      />
      <KpiCard
        label="Overdue"
        value={formatCurrency(overdue)}
        note="Past the repayment due date"
        accent={overdue > 0 ? 'danger' : 'accent'}
        icon={<AlertTriangle size={14} />}
      />
      <KpiCard
        label="Active accounts"
        value={activeCount}
        note="Approved to buy on credit"
        accent="accent"
        icon={<Users size={14} />}
      />
      <KpiCard
        label="Pending approvals"
        value={pendingCount}
        note="Awaiting a manager decision"
        accent={pendingCount > 0 ? 'warning' : 'accent'}
        icon={<Inbox size={14} />}
      />
    </div>
  );
}
