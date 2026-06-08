/**
 * Single source of truth for the billing-grid columns (BUSY 21 voucher layout).
 * The header row, the committed rows (`PosBillingGridRow`), the inline entry row
 * (`PosBillingEntryRow`), and the empty filler rows all render against this list
 * and share one `<colgroup>`, so every cell lines up under a `table-fixed`
 * layout. The **Item** column has no fixed width — it absorbs the remaining space.
 */
export type BillingAlign = 'left' | 'right' | 'center';

export interface BillingColumn {
    key: string;
    header: string;
    /** Fixed width in px. Omit for the flexible Item column. */
    width?: number;
    align?: BillingAlign;
}

export const BILLING_COLUMNS: BillingColumn[] = [
    { key: 'sno', header: 'S.N.', width: 56, align: 'right' },
    { key: 'name', header: 'Item', align: 'left' },
    { key: 'qty', header: 'Qty.', width: 100, align: 'right' },
    { key: 'unit', header: 'Unit', width: 108, align: 'left' },
    { key: 'price', header: 'Price (Rs.)', width: 120, align: 'right' },
    { key: 'disc', header: 'Disc %', width: 80, align: 'right' },
    { key: 'amount', header: 'Amount (Rs.)', width: 132, align: 'right' },
];

export function alignClass(align?: BillingAlign): string {
    return align === 'right'
        ? 'text-right'
        : align === 'center'
          ? 'text-center'
          : 'text-left';
}
