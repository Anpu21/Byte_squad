import { LuTrash2 as Trash2 } from 'react-icons/lu';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { IOrderLineDraft, ParsedOrderLine } from './order-form.lib';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

interface OrderProductOption {
    id: string;
    name: string;
    barcode: string;
}

interface OrderLineTableProps {
    parsed: ParsedOrderLine[];
    products: OrderProductOption[];
    productsLoading: boolean;
    onPickProduct: (
        key: number,
        productId: string,
        currentUnitCost: string,
    ) => void;
    onPatchLine: (key: number, patch: Partial<IOrderLineDraft>) => void;
    onRemoveLine: (key: number) => void;
}

/** The ordered-lines grid: product, qty, unit cost, and line amount. */
export function OrderLineTable({
    parsed,
    products,
    productsLoading,
    onPickProduct,
    onPatchLine,
    onRemoveLine,
}: OrderLineTableProps) {
    return (
        <div className="overflow-x-auto border border-border rounded-md">
            <table className="w-full text-left">
                <thead className="bg-surface-2/60 border-b border-border">
                    <tr className="text-[11px] uppercase tracking-wide text-text-3">
                        <th className="px-2 py-2 font-medium min-w-[200px]">
                            Item
                        </th>
                        <th className="px-2 py-2 font-medium w-24">Qty</th>
                        <th className="px-2 py-2 font-medium w-28">Unit cost</th>
                        <th className="px-2 py-2 font-medium text-right w-28">
                            Amount
                        </th>
                        <th className="px-2 py-2 w-10" />
                    </tr>
                </thead>
                <tbody>
                    {parsed.map((line) => (
                        <tr
                            key={line.key}
                            className="border-b border-border last:border-b-0"
                        >
                            <td className="px-2 py-1.5">
                                <select
                                    className={`${INPUT_CLASS} field-select w-full h-8`}
                                    value={line.productId}
                                    onChange={(e) =>
                                        onPickProduct(
                                            line.key,
                                            e.target.value,
                                            line.unitCost,
                                        )
                                    }
                                    aria-label="Product"
                                >
                                    <option value="">
                                        {productsLoading
                                            ? 'Loading…'
                                            : 'Select product'}
                                    </option>
                                    {products.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.barcode})
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td className="px-2 py-1.5">
                                <input
                                    className={`${INPUT_CLASS} w-full h-8 text-right`}
                                    type="number"
                                    min="0.001"
                                    step="0.001"
                                    value={line.quantity}
                                    onChange={(e) =>
                                        onPatchLine(line.key, {
                                            quantity: e.target.value,
                                        })
                                    }
                                    aria-label="Quantity"
                                />
                            </td>
                            <td className="px-2 py-1.5">
                                <input
                                    className={`${INPUT_CLASS} w-full h-8 text-right`}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={line.unitCost}
                                    onChange={(e) =>
                                        onPatchLine(line.key, {
                                            unitCost: e.target.value,
                                        })
                                    }
                                    aria-label="Unit cost"
                                />
                            </td>
                            <td className="px-2 py-1.5 text-right text-[13px] tabular-nums text-text-1">
                                {Number.isFinite(line.qtyNum) &&
                                Number.isFinite(line.costNum) &&
                                line.quantity !== '' &&
                                line.unitCost !== ''
                                    ? formatCurrency(line.qtyNum * line.costNum)
                                    : '—'}
                            </td>
                            <td className="px-2 py-1.5 text-right">
                                <button
                                    type="button"
                                    onClick={() => onRemoveLine(line.key)}
                                    aria-label="Remove line"
                                    className="inline-flex items-center justify-center w-7 h-7 rounded text-text-3 hover:text-danger hover:bg-danger-soft transition-colors disabled:opacity-40"
                                    disabled={parsed.length === 1}
                                >
                                    <Trash2 size={14} aria-hidden />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
