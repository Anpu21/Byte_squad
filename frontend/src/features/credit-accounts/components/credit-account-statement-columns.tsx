import Pill from '@/components/ui/Pill';
import { type DataTableColumn } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type {
  ICreditAccountOutstandingSale,
  ICreditAccountTransactionRow,
} from '@/types';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

/** Loan-book ledger columns (credit taken / paid) for the statement view. */
export const LEDGER_COLUMNS: DataTableColumn<ICreditAccountTransactionRow>[] = [
  {
    key: 'date',
    header: 'Date',
    className: 'text-[12px] text-text-2 whitespace-nowrap',
    render: (t) => new Date(t.createdAt).toLocaleString(),
  },
  {
    key: 'ref',
    header: 'Ref',
    className: 'text-[12px] text-text-2 mono',
    render: (t) => t.referenceNo,
  },
  {
    key: 'type',
    header: 'Type',
    render: (t) => (
      <Pill tone={t.transactionType === 'Credit_Taken' ? 'warning' : 'success'}>
        {t.transactionType === 'Credit_Taken' ? 'Taken' : 'Paid'}
      </Pill>
    ),
  },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    numeric: true,
    className: 'text-text-1',
    render: (t) => formatCurrency(Number(t.amount)),
  },
  {
    key: 'balance',
    header: 'Balance',
    align: 'right',
    numeric: true,
    className: 'text-text-2',
    render: (t) => formatCurrency(Number(t.runningBalance)),
  },
];

/** Unpaid-bills columns (with overdue status) for the statement view. */
export const OUTSTANDING_COLUMNS: DataTableColumn<ICreditAccountOutstandingSale>[] =
  [
    {
      key: 'invoice',
      header: 'Invoice',
      className: 'text-[12px] mono',
      render: (s) => s.invoiceNumber,
    },
    {
      key: 'due',
      header: 'Due',
      className: 'text-[12px] text-text-2 whitespace-nowrap',
      render: (s) => (s.dueDate ? formatDate(s.dueDate) : '—'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) =>
        s.isOverdue ? (
          <Pill tone="danger">{s.overdueDays}d overdue</Pill>
        ) : (
          <Pill tone="neutral">On time</Pill>
        ),
    },
    {
      key: 'balance',
      header: 'Balance due',
      align: 'right',
      numeric: true,
      className: 'font-semibold',
      render: (s) => formatCurrency(Number(s.balanceDue)),
    },
  ];
