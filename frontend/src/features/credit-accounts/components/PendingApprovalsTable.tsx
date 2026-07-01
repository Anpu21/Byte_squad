import {
  Button,
  DataTable,
  EmptyState,
  type DataTableColumn,
} from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { ICreditAccountRow } from '@/types';

interface PendingApprovalsTableProps {
  rows: ICreditAccountRow[];
  isLoading: boolean;
  onApprove: (row: ICreditAccountRow) => void;
  onReject: (row: ICreditAccountRow) => void;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

/** Walk-in credit requests awaiting a manager's approve/reject decision. */
export function PendingApprovalsTable({
  rows,
  isLoading,
  onApprove,
  onReject,
}: PendingApprovalsTableProps) {
  const columns: DataTableColumn<ICreditAccountRow>[] = [
    {
      key: 'holder',
      header: 'Customer',
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
      key: 'requested',
      header: 'Requested limit',
      align: 'right',
      numeric: true,
      className: 'text-text-2',
      render: (r) =>
        r.requestedCreditLimit === null
          ? '—'
          : formatCurrency(r.requestedCreditLimit),
    },
    {
      key: 'by',
      header: 'Requested by',
      className: 'text-text-2',
      render: (r) => r.requestedByName ?? '—',
    },
    {
      key: 'submitted',
      header: 'Submitted',
      numeric: true,
      className: 'text-text-2 whitespace-nowrap',
      render: (r) => formatDate(r.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={() => onReject(r)}>
            Reject
          </Button>
          <Button size="sm" variant="primary" onClick={() => onApprove(r)}>
            Approve
          </Button>
        </div>
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
      clientPaginate={{ unit: 'requests' }}
      empty={
        <EmptyState
          title="No pending requests"
          description="When a cashier enrolls a walk-in customer for store credit, the request appears here for approval."
        />
      }
    />
  );
}
