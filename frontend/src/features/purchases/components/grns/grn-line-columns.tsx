import { type DataTableColumn } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { IGrn } from '@/types';

type GrnLine = NonNullable<IGrn['items']>[number];

/** Columns for the received-lines table in the GRN drill-down. */
export const GRN_LINE_COLUMNS: DataTableColumn<GrnLine>[] = [
    {
        key: 'item',
        header: 'Item',
        render: (it) => it.product?.name ?? it.productId,
    },
    {
        key: 'qty',
        header: 'Qty',
        align: 'right',
        numeric: true,
        render: (it) => Number(it.quantity),
    },
    {
        key: 'unitCost',
        header: 'Unit cost',
        align: 'right',
        numeric: true,
        className: 'text-text-2',
        render: (it) => formatCurrency(Number(it.unitCost)),
    },
    {
        key: 'batch',
        header: 'Batch / expiry',
        className: 'text-[12px] text-text-3',
        render: (it) =>
            `${it.batchNo ?? '—'}${it.expiryDate ? ` · exp ${it.expiryDate}` : ''}`,
    },
    {
        key: 'amount',
        header: 'Amount',
        align: 'right',
        numeric: true,
        render: (it) => formatCurrency(Number(it.lineTotal)),
    },
];
