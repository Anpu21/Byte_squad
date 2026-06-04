import { formatCurrency } from '@/lib/utils';
import { formatQuantity } from '@/features/pos/lib/format-quantity';
import type { ISaleItem } from '@/types';

interface IPosBillItemRowsProps {
    item: ISaleItem;
}

/**
 * Resolves the unit label printed beside the quantity. Prefers the picked
 * sellable unit (eager-loaded on `item.unit`) so a 250g line reads "250 g";
 * falls back to the product's base unit (e.g. "kg") so a base-unit line
 * still reads "1 kg"; returns null when neither is available (older sales
 * predating the unit eager-load, or seeds that left baseUnit unset).
 */
function resolveUnitLabel(item: ISaleItem): string | null {
    const picked = item.unit?.name;
    if (picked && picked.length > 0) return picked;
    const base = item.product?.baseUnit;
    if (base && base.length > 0) return base;
    return null;
}

/**
 * Render a single sale line as a stack of table rows: header (product
 * name), price row (qty × unit = total), then indented sub-rows for
 * discount, tax, and free quantity when present. Pulled out so the
 * parent template stays under the file-size budget.
 *
 * The quantity cell now reads "250 g × LKR 0.20/g" when the picked unit
 * is known, so the customer and cashier can tell at a glance whether
 * "250" means grams of rice or packs of bread. Lines that predate the
 * unit eager-load gracefully fall back to "250 × LKR 0.20" — the totals
 * are unchanged because the backend already persists the canonical
 * `lineTotal`.
 */
export function PosBillItemRows({ item }: IPosBillItemRowsProps) {
    const name = item.product?.name ?? `Product ${item.productId.slice(0, 6)}`;
    const unitLabel = resolveUnitLabel(item);
    const perUnitPrice = item.unitPrice;
    const qtyLabel = formatQuantity(item.quantity);
    const freeLabel = formatQuantity(item.free);
    return (
        <>
            <tr>
                <td className="pt-1 align-top" colSpan={2}>
                    <span className="font-semibold">{name}</span>
                </td>
            </tr>
            <tr>
                <td className="pl-2 align-top text-text-2 tabular-nums">
                    {qtyLabel}
                    {unitLabel ? ` ${unitLabel}` : ''} ×{' '}
                    {formatCurrency(perUnitPrice)}
                    {unitLabel ? `/${unitLabel}` : ''}
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
                        Free: {freeLabel}
                        {unitLabel ? ` ${unitLabel}` : ''}
                    </td>
                </tr>
            ) : null}
        </>
    );
}
