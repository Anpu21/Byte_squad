import {
  Button,
  DataTable,
  EmptyState,
  type DataTableColumn,
} from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { ICreditAccountRow } from '@/types';
import { CreditAccountStatusPill } from './CreditAccountStatusPill';

interface CreditAccountsTableProps {
  rows: ICreditAccountRow[];
  isLoading: boolean;
  onOpenStatement: (row: ICreditAccountRow) => void;
}

/** Approved (and past) credit accounts with balances, limits, and ageing. */
export function CreditAccountsTable({
  rows,
  isLoading,
  onOpenStatement,
}: CreditAccountsTableProps) {
  const columns: DataTableColumn<ICreditAccountRow>[] = [
    {
      key: 'holder',
      header: 'Account',
      className: 'font-medium',
      render: (r) => (
        <div className="flex flex-col">
          <span>{r.holderName}</span>
          <span className="text-[11px] text-text-3">{r.accountNo}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      className: 'text-text-2',
      render: (r) => r.phone,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <CreditAccountStatusPill status={r.status} />,
    },
    {
      key: 'limit',
      header: 'Limit',
      align: 'right',
      numeric: true,
      className: 'text-text-2',
      render: (r) =>
        r.creditLimit === null ? '∞' : formatCurrency(r.creditLimit),
    },
    {
      key: 'balance',
      header: 'Balance',
      align: 'right',
      numeric: true,
      className: 'font-semibold',
      render: (r) => (
        <span className={r.currentBalance > 0 ? 'text-danger' : 'text-text-2'}>
          {formatCurrency(r.currentBalance)}
        </span>
      ),
    },
    {
      key: 'available',
      header: 'Available',
      align: 'right',
      numeric: true,
      className: 'text-text-2',
      render: (r) =>
        r.availableCredit === null ? '∞' : formatCurrency(r.availableCredit),
    },
    {
      key: 'overdue',
      header: 'Overdue',
      align: 'right',
      numeric: true,
      render: (r) =>
        r.ageing.overdueTotal > 0 ? (
          <span className="text-danger font-semibold">
            {formatCurrency(r.ageing.overdueTotal)}
          </span>
        ) : (
          <span className="text-text-3">—</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onOpenStatement(r)}
        >
          Statement
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowKey={(r) => r.id}
      isLoading={isLoading}
      zebra
      empty={
        <EmptyState
          title="No credit accounts yet"
          description="Approved store-credit accounts appear here with their balances and overdue ageing."
        />
      }
    />
  );
}
