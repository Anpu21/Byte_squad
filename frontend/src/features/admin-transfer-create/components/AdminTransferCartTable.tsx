import { type RefObject, useMemo } from 'react';
import { AlertTriangle, Minus, Plus, X } from 'lucide-react';
import { useInventoryByBranchQuery } from '@/hooks/useInventoryByBranchQuery';
import type { IProduct } from '@/types';
import type { TransferCartLine } from '../types/transfer-cart-line.type';
import { AdminTransferCartAddRow } from './AdminTransferCartAddRow';

const INVENTORY_LIMIT = 500;

interface AdminTransferCartTableProps {
    sourceBranchId: string;
    destinationBranchId: string;
    lines: TransferCartLine[];
    totalUnits: number;
    onUpdateQuantity: (productId: string, qty: number) => void;
    onRemove: (productId: string) => void;
    onSelectProduct: (product: IProduct) => void;
    onOpenCamera: () => void;
    inputRef: RefObject<HTMLInputElement | null>;
}

export function AdminTransferCartTable({
    sourceBranchId,
    destinationBranchId,
    lines,
    totalUnits,
    onUpdateQuantity,
    onRemove,
    onSelectProduct,
    onOpenCamera,
    inputRef,
}: AdminTransferCartTableProps) {
    const sourceInventoryQuery = useInventoryByBranchQuery(
        sourceBranchId || undefined,
        { limit: INVENTORY_LIMIT },
        { enabled: Boolean(sourceBranchId) },
    );
    const destinationInventoryQuery = useInventoryByBranchQuery(
        destinationBranchId || undefined,
        { limit: INVENTORY_LIMIT },
        { enabled: Boolean(destinationBranchId) },
    );

    const sourceQtyByProduct = useMemo(() => {
        const map = new Map<string, number>();
        for (const row of sourceInventoryQuery.data?.items ?? []) {
            map.set(row.productId, row.quantity);
        }
        return map;
    }, [sourceInventoryQuery.data]);

    const destQtyByProduct = useMemo(() => {
        const map = new Map<string, number>();
        for (const row of destinationInventoryQuery.data?.items ?? []) {
            map.set(row.productId, row.quantity);
        }
        return map;
    }, [destinationInventoryQuery.data]);

    return (
        <div className="flex-1 min-h-[240px] overflow-y-auto overflow-x-visible">
            <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-surface z-[1]">
                    <tr className="text-[10px] uppercase tracking-[0.1em] text-text-3 border-b border-border">
                        <th className="px-3 py-2.5 font-semibold w-[40px] text-center">
                            #
                        </th>
                        <th className="px-3 py-2.5 font-semibold">Product</th>
                        <th className="px-2 py-2.5 font-semibold text-right w-[110px]">
                            Source qty
                        </th>
                        <th className="px-2 py-2.5 font-semibold text-center w-[140px]">
                            Transfer qty
                        </th>
                        <th className="px-2 py-2.5 font-semibold text-right w-[110px]">
                            Dest qty
                        </th>
                        <th className="px-4 py-2.5 font-semibold text-right w-[140px]">
                            After transfer
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {lines.map((line, idx) => {
                        const sourceQty =
                            sourceQtyByProduct.get(line.product.id) ?? null;
                        const destQty =
                            destQtyByProduct.get(line.product.id) ?? null;
                        const overshoot =
                            sourceQty !== null && line.quantity > sourceQty;
                        const afterTransfer =
                            destQty !== null ? destQty + line.quantity : null;

                        return (
                            <tr
                                key={line.product.id}
                                className="border-b border-border last:border-b-0 hover:bg-surface-2 group transition-colors align-middle"
                            >
                                <td className="px-3 py-3 text-center align-middle">
                                    <span className="text-[12px] text-text-3 tabular-nums mono">
                                        {idx + 1}
                                    </span>
                                </td>
                                <td className="px-3 py-3 min-w-0">
                                    <div className="flex items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-medium text-text-1 truncate leading-tight">
                                                {line.product.name}
                                            </p>
                                            <p className="text-[11px] text-text-3 mono mt-0.5 truncate">
                                                {line.product.barcode ||
                                                    line.product.id.slice(0, 10)}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => onRemove(line.product.id)}
                                            aria-label={`Remove ${line.product.name}`}
                                            className="p-1 -mt-0.5 -mr-1 rounded text-text-3 hover:text-danger hover:bg-danger-soft opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all focus:outline-none focus:ring-[3px] focus:ring-danger/20"
                                        >
                                            <X size={12} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </td>
                                <td className="px-2 py-3 text-right tabular-nums">
                                    {sourceQty === null ? (
                                        <span className="text-[12px] text-text-3 mono">
                                            —
                                        </span>
                                    ) : (
                                        <span
                                            className={`inline-flex items-center gap-1 text-[13px] mono ${
                                                overshoot
                                                    ? 'text-warning font-semibold'
                                                    : 'text-text-2'
                                            }`}
                                        >
                                            {overshoot && (
                                                <AlertTriangle
                                                    size={12}
                                                    strokeWidth={2.25}
                                                />
                                            )}
                                            {sourceQty}
                                        </span>
                                    )}
                                </td>
                                <td className="px-1 py-3 text-center">
                                    <div
                                        className={`inline-flex items-center gap-0.5 border rounded-md p-0.5 ${
                                            overshoot
                                                ? 'bg-warning-soft border-warning/40'
                                                : 'bg-canvas border-border'
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onUpdateQuantity(
                                                    line.product.id,
                                                    line.quantity - 1,
                                                )
                                            }
                                            aria-label="Decrease quantity"
                                            className="w-6 h-6 rounded text-text-2 hover:text-text-1 hover:bg-primary-soft transition-colors flex items-center justify-center"
                                        >
                                            <Minus size={12} />
                                        </button>
                                        <input
                                            type="number"
                                            min={1}
                                            max={sourceQty ?? undefined}
                                            value={line.quantity}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                if (v === '') return;
                                                const n = parseInt(v, 10);
                                                if (!Number.isNaN(n)) {
                                                    onUpdateQuantity(
                                                        line.product.id,
                                                        n,
                                                    );
                                                }
                                            }}
                                            aria-label={`Transfer quantity for ${line.product.name}`}
                                            className="w-12 h-6 text-center bg-transparent text-text-1 text-[13px] font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onUpdateQuantity(
                                                    line.product.id,
                                                    line.quantity + 1,
                                                )
                                            }
                                            aria-label="Increase quantity"
                                            className="w-6 h-6 rounded text-text-2 hover:text-text-1 hover:bg-primary-soft transition-colors flex items-center justify-center"
                                        >
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                </td>
                                <td className="px-2 py-3 text-right tabular-nums">
                                    <span className="text-[13px] text-text-2 mono">
                                        {destQty ?? '—'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums">
                                    <span className="text-[13px] font-semibold text-text-1 mono">
                                        {afterTransfer ?? '—'}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}

                    <AdminTransferCartAddRow
                        sourceBranchId={sourceBranchId}
                        onSelectProduct={onSelectProduct}
                        onOpenCamera={onOpenCamera}
                        inputRef={inputRef}
                    />
                </tbody>

                <tfoot>
                    <tr className="border-t-2 border-border-strong bg-surface-2/30">
                        <td colSpan={3} className="px-4 py-2.5 text-right">
                            <span className="text-[11px] uppercase tracking-[0.1em] text-text-2 font-semibold">
                                Total units to transfer
                            </span>
                        </td>
                        <td className="px-4 py-2.5 text-center tabular-nums">
                            <span className="text-xl font-bold text-text-1 tracking-tight leading-none mono">
                                {totalUnits}
                            </span>
                        </td>
                        <td colSpan={2} />
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
