import { formatCurrency } from '@/lib/utils';
import type { ISaleItem } from '@/types';

interface IPosBillItemRowsProps {
    item: ISaleItem;
}

/**
 * Render a single sale line as a stack of table rows: header (product
 * name), price row (qty × unit = total), then indented sub-rows for
 * discount, tax, and free quantity when present. Pulled out so the
 * parent template stays under the file-size budget.
 */
export function PosBillItemRows({ item }: IPosBillItemRowsProps) {
    const name = item.product?.name ?? `Product ${item.productId.slice(0, 6)}`;
    return (
        <>
            <tr>
                <td className="pt-1 align-top" colSpan={2}>
                    <span className="font-semibold">{name}</span>
                </td>
            </tr>
            <tr>
                <td className="pl-2 align-top text-text-2 tabular-nums">
                    {item.quantity} × {formatCurrency(item.unitPrice)}
                </td>
                <td className="text-right align-top tabular-nums">
                    {formatCurrency(item.lineTotal)}
                </td>
            </tr>
            {item.lineDiscountPercentage > 0 ? (
                <tr>
                    <td className="pl-2 text-text-2 tabular-nums" colSpan={2}>
                        −{item.lineDiscountPercentage}% disc{' '}
                        {formatCurrency(item.discountAmount)}
                    </td>
                </tr>
            ) : null}
            {item.lineTaxRate > 0 ? (
                <tr>
                    <td className="pl-2 text-text-2 tabular-nums" colSpan={2}>
                        +Tax {item.lineTaxRate}%{' '}
                        {formatCurrency(item.lineTaxAmount)}
                    </td>
                </tr>
            ) : null}
            {item.free > 0 ? (
                <tr>
                    <td className="pl-2 text-text-2 tabular-nums" colSpan={2}>
                        Free: {item.free}
                    </td>
                </tr>
            ) : null}
        </>
    );
}
