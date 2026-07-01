import {
    LuTriangleAlert as AlertTriangle,
    LuMinus as Minus,
    LuPlus as Plus,
    LuX as X,
} from 'react-icons/lu';
import type { TransferCartLine } from '../types/transfer-cart-line.type';

interface AdminTransferCartRowProps {
    line: TransferCartLine;
    index: number;
    sourceQty: number | null;
    destQty: number | null;
    onUpdateQuantity: (productId: string, qty: number) => void;
    onRemove: (productId: string) => void;
}

/** One product line in the transfer cart: source/dest qty, qty stepper, after-transfer. */
export function AdminTransferCartRow({
    line,
    index,
    sourceQty,
    destQty,
    onUpdateQuantity,
    onRemove,
}: AdminTransferCartRowProps) {
    const overshoot = sourceQty !== null && line.quantity > sourceQty;
    const afterTransfer = destQty !== null ? destQty + line.quantity : null;

    return (
        <tr className="border-b border-border last:border-b-0 hover:bg-surface-2 group transition-colors align-middle">
            <td className="px-3 py-3 text-center align-middle">
                <span className="text-[12px] text-text-3 tabular-nums mono">
                    {index + 1}
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
                    <span className="text-[12px] text-text-3 mono">—</span>
                ) : (
                    <span
                        className={`inline-flex items-center gap-1 text-[13px] mono ${
                            overshoot
                                ? 'text-warning font-semibold'
                                : 'text-text-2'
                        }`}
                    >
                        {overshoot && (
                            <AlertTriangle size={12} strokeWidth={2.25} />
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
                            onUpdateQuantity(line.product.id, line.quantity - 1)
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
                                onUpdateQuantity(line.product.id, n);
                            }
                        }}
                        aria-label={`Transfer quantity for ${line.product.name}`}
                        className="w-12 h-6 text-center bg-transparent text-text-1 text-[13px] font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                        type="button"
                        onClick={() =>
                            onUpdateQuantity(line.product.id, line.quantity + 1)
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
}
