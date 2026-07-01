import Pill from '@/components/ui/Pill';
import { type DataTableColumn } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { useCreditStatement } from '../hooks/useCreditStatement';

type StatementTransaction = NonNullable<
    ReturnType<typeof useCreditStatement>['data']
>['transactions'][number];

/** Columns for the customer credit-statement ledger. */
export const STATEMENT_COLUMNS: DataTableColumn<StatementTransaction>[] = [
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
            <Pill
                tone={
                    t.transactionType === 'Credit_Taken' ? 'warning' : 'success'
                }
                dot={false}
            >
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
