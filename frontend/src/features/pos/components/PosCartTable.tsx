import { type RefObject, useRef, useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { IProduct } from '@/types';
import type { CartItem } from '../types/cart-item.type';
import { usePosCartTableNav } from '../hooks/usePosCartTableNav';
import { PosDiscountEditor } from './PosDiscountEditor';
import { PosCartAddRow } from './PosCartAddRow';

const COL_BORDER = 'border-r border-border';

interface PosCartTableProps {
    cart: CartItem[];
    onUpdateQuantity: (productId: string, newQty: number) => void;
    onRemove: (productId: string) => void;
    onSetItemDiscount: (productId: string, amount: number | undefined) => void;
    totalDiscount: number;
    total: number;
    branchId: string | null | undefined;
    stockByProductId?: Record<string, number>;
    onSelectProduct: (product: IProduct) => void;
    onOpenCamera: () => void;
    inputRef: RefObject<HTMLInputElement | null>;
}

function formatLineDiscount(item: CartItem): string {
    const amount = item.lineDiscountAmount ?? 0;
    if (amount <= 0) return '—';
    return `−${amount}%`;
}

export function PosCartTable({
    cart,
    onUpdateQuantity,
    onRemove,
    onSetItemDiscount,
    totalDiscount,
    total,
    branchId,
    stockByProductId,
    onSelectProduct,
    onOpenCamera,
    inputRef,
}: PosCartTableProps) {
    const [editingDiscountId, setEditingDiscountId] = useState<string | null>(
        null,
    );
    const tableRef = useRef<HTMLTableElement>(null);
    const onCellKeyDown = usePosCartTableNav({
        rowCount: cart.length,
        colCount: 2,
        tableRef,
        fallbackRef: inputRef,
    });

    function commitDiscount(productId: string, amount: number) {
        onSetItemDiscount(productId, amount > 0 ? amount : undefined);
        setEditingDiscountId(null);
    }

    return (
        <div className="flex-1 min-h-[240px] overflow-y-auto overflow-x-visible">
            <table
                ref={tableRef}
                className="w-full text-left border-collapse"
            >
                <thead className="sticky top-0 bg-surface z-[1]">
                    <tr className="text-[10px] uppercase tracking-[0.1em] text-text-3 border-b-2 border-border">
                        <th
                            className={`px-3 py-2.5 font-semibold w-[40px] text-center ${COL_BORDER}`}
                        >
                            #
                        </th>
                        <th className={`px-3 py-2.5 font-semibold ${COL_BORDER}`}>
                            Product
                        </th>
                        <th
                            className={`px-2 py-2.5 font-semibold text-right w-[100px] ${COL_BORDER}`}
                        >
                            Price
                        </th>
                        <th
                            className={`px-2 py-2.5 font-semibold text-center w-[120px] ${COL_BORDER}`}
                        >
                            Qty
                        </th>
                        <th
                            className={`px-2 py-2.5 font-semibold text-right w-[150px] ${COL_BORDER}`}
                        >
                            Discount
                        </th>
                        <th className="px-4 py-2.5 font-semibold text-right w-[130px]">
                            After Discount
                        </th>
                    </tr>
                </thead>

                <tbody onKeyDown={onCellKeyDown}>
                    {cart.map((item, idx) => {
                        const isEditing =
                            editingDiscountId === item.product.id;
                        const hasDiscount =
                            (item.lineDiscountAmount ?? 0) > 0;
                        const stock = stockByProductId?.[item.product.id];
                        const atCap =
                            stock !== undefined && item.quantity >= stock;
                        return (
                            <tr
                                key={item.product.id}
                                className="border-b border-border last:border-b-0 hover:bg-surface-2 group transition-colors align-middle"
                            >
                                <td
                                    className={`px-3 py-3 text-center align-middle ${COL_BORDER}`}
                                >
                                    <span className="text-[12px] text-text-3 tabular-nums mono">
                                        {idx + 1}
                                    </span>
                                </td>
                                <td className={`px-3 py-3 min-w-0 ${COL_BORDER}`}>
                                    <div className="flex items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-medium text-text-1 truncate leading-tight">
                                                {item.product.name}
                                            </p>
                                            <p className="text-[11px] text-text-3 mono mt-0.5 truncate">
                                                {item.product.barcode ||
                                                    item.product.id.slice(0, 10)}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onRemove(item.product.id)
                                            }
                                            aria-label={`Remove ${item.product.name}`}
                                            className="p-1 -mt-0.5 -mr-1 rounded text-text-3 hover:text-danger hover:bg-danger-soft opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all focus:outline-none focus:ring-[3px] focus:ring-danger/20"
                                        >
                                            <X size={12} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </td>
                                <td
                                    className={`px-2 py-3 text-right tabular-nums ${COL_BORDER}`}
                                >
                                    <span className="text-[13px] text-text-2 mono">
                                        {formatCurrency(item.unitPrice)}
                                    </span>
                                </td>
                                <td className={`px-1 py-3 text-center ${COL_BORDER}`}>
                                    <div className="inline-flex items-center gap-0.5 bg-canvas border border-border rounded-md p-0.5">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onUpdateQuantity(
                                                    item.product.id,
                                                    item.quantity - 1,
                                                )
                                            }
                                            aria-label="Decrease quantity"
                                            className="w-6 h-6 rounded text-text-2 hover:text-text-1 hover:bg-primary-soft transition-colors flex items-center justify-center"
                                        >
                                            <Minus size={12} />
                                        </button>
                                        <input
                                            type="number"
                                            min="1"
                                            max={stock}
                                            value={item.quantity}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                if (v === '') return;
                                                const n = parseInt(v, 10);
                                                if (!Number.isNaN(n)) {
                                                    onUpdateQuantity(
                                                        item.product.id,
                                                        n,
                                                    );
                                                }
                                            }}
                                            aria-label={`Quantity for ${item.product.name}`}
                                            data-cell-row={idx}
                                            data-cell-col={0}
                                            className="w-9 h-6 text-center bg-transparent text-text-1 text-[13px] font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <button
                                            type="button"
                                            disabled={atCap}
                                            onClick={() =>
                                                onUpdateQuantity(
                                                    item.product.id,
                                                    item.quantity + 1,
                                                )
                                            }
                                            aria-label="Increase quantity"
                                            title={
                                                atCap
                                                    ? `Only ${stock} in stock`
                                                    : undefined
                                            }
                                            className="w-6 h-6 rounded text-text-2 hover:text-text-1 hover:bg-primary-soft transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-2"
                                        >
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                    {atCap && (
                                        <p className="mt-1 text-[10.5px] text-warning font-medium">
                                            Only {stock} in stock
                                        </p>
                                    )}
                                </td>
                                <td className={`px-2 py-3 text-right ${COL_BORDER}`}>
                                    {isEditing ? (
                                        <PosDiscountEditor
                                            initialAmount={
                                                item.lineDiscountAmount ?? 0
                                            }
                                            onCommit={(amount) =>
                                                commitDiscount(
                                                    item.product.id,
                                                    amount,
                                                )
                                            }
                                            onCancel={() =>
                                                setEditingDiscountId(null)
                                            }
                                        />
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setEditingDiscountId(
                                                    item.product.id,
                                                )
                                            }
                                            aria-label={
                                                hasDiscount
                                                    ? `Edit discount for ${item.product.name}`
                                                    : `Add discount to ${item.product.name}`
                                            }
                                            data-cell-row={idx}
                                            data-cell-col={1}
                                            className={`inline-flex items-center justify-end gap-1 px-2 py-1 rounded-md text-[11px] font-semibold tabular-nums mono transition-colors focus:outline-none focus:ring-[3px] focus:ring-warning/30 ${
                                                hasDiscount
                                                    ? 'bg-warning-soft text-warning border border-warning/30'
                                                    : 'text-text-3 hover:text-text-1 hover:bg-surface-2 border border-transparent'
                                            }`}
                                        >
                                            {formatLineDiscount(item)}
                                        </button>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums">
                                    <span className="text-[13px] font-semibold text-text-1 mono">
                                        {formatCurrency(
                                            item.effectiveLineTotal,
                                        )}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}

                    <PosCartAddRow
                        branchId={branchId}
                        onSelectProduct={onSelectProduct}
                        onOpenCamera={onOpenCamera}
                        inputRef={inputRef}
                    />
                </tbody>

                <tfoot>
                    <tr className="border-t-2 border-border-strong bg-surface-2/30">
                        <td
                            colSpan={5}
                            className={`px-4 py-2.5 text-right ${COL_BORDER}`}
                        >
                            <span className="text-[11px] uppercase tracking-[0.1em] text-text-2 font-semibold">
                                Total Discount
                            </span>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                            <span className="text-[13px] text-danger mono">
                                {totalDiscount > 0
                                    ? `−${formatCurrency(totalDiscount)}`
                                    : '—'}
                            </span>
                        </td>
                    </tr>
                    <tr className="border-t border-border bg-surface-2/40">
                        <td
                            colSpan={5}
                            className={`px-4 py-3 text-right ${COL_BORDER}`}
                        >
                            <span className="text-[11px] uppercase tracking-[0.1em] text-text-1 font-bold">
                                Total Bill Amount · LKR
                            </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                            <span className="text-xl font-bold text-text-1 tracking-tight leading-none mono">
                                {formatCurrency(total).replace('LKR', '').trim()}
                            </span>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
