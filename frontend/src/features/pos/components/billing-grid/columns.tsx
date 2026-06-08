/**
 * Single source of truth for the billing-grid columns. The header row, the
 * committed rows (`PosBillingGridRow`), and the inline entry row
 * (`PosBillingEntryRow`) all render against this list and share one
 * `<colgroup>`, so every cell lines up under a `table-fixed` layout. The
 * **Product Name** column has no fixed width — it absorbs the remaining space.
 */
export type BillingAlign = 'left' | 'right' | 'center';

export interface BillingColumn {
    key: string;
    header: string;
    /** Fixed width in px. Omit for the flexible Product Name column. */
    width?: number;
    align?: BillingAlign;
}

export const BILLING_COLUMNS: BillingColumn[] = [
    { key: 'sno', header: '#', width: 44, align: 'right' },
    { key: 'code', header: 'Code', width: 96, align: 'left' },
    { key: 'name', header: 'Product Name', align: 'left' },
    { key: 'unit', header: 'Unit', width: 120, align: 'left' },
    { key: 'price', header: 'Price', width: 112, align: 'right' },
    { key: 'disc', header: 'Disc %', width: 80, align: 'right' },
    { key: 'qty', header: 'Qty', width: 96, align: 'right' },
    { key: 'amount', header: 'Amount', width: 120, align: 'right' },
    { key: 'actions', header: '', width: 52, align: 'center' },
];

export function alignClass(align?: BillingAlign): string {
    return align === 'right'
        ? 'text-right'
        : align === 'center'
          ? 'text-center'
          : 'text-left';
}
