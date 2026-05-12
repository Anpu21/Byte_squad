import { Minus, Plus, ShoppingCart, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { CartItem } from '../types/cart-item.type';

interface PosCartTableProps {
    cart: CartItem[];
    onUpdateQuantity: (productId: string, newQty: number) => void;
    onRemove: (productId: string) => void;
}

export default function PosCartTable({
    cart,
    onUpdateQuantity,
    onRemove,
}: PosCartTableProps) {
    if (cart.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[160px] text-center">
                <div className="w-12 h-12 rounded-full bg-surface-2 border border-border flex items-center justify-center mb-3">
                    <ShoppingCart size={20} strokeWidth={1.5} className="text-text-3" />
                </div>
                <p className="text-sm font-medium text-text-2">Cart is empty</p>
                <p className="text-xs text-text-3 mt-1">
                    Scan a barcode or search to add products.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto min-h-[140px]">
            <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-surface z-[1]">
                    <tr className="text-[10px] uppercase tracking-[0.1em] text-text-3 border-b border-border">
                        <th className="px-5 py-2 font-semibold">Product</th>
                        <th className="px-2 py-2 font-semibold text-center w-[88px]">
                            Qty
                        </th>
                        <th className="px-5 py-2 font-semibold text-right w-[96px]">
                            Price
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {cart.map((item) => (
                        <tr
                            key={item.product.id}
                            className="border-b border-border last:border-b-0 hover:bg-surface-2 group transition-colors align-top"
                        >
                            <td className="px-5 py-3 min-w-0">
                                <div className="flex items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-medium text-text-1 truncate leading-tight">
                                            {item.isCustom && (
                                                <span className="text-text-3 mr-1 text-[10px] uppercase tracking-wider">
                                                    Custom
                                                </span>
                                            )}
                                            {item.product.name}
                                        </p>
                                        <p className="text-[11px] text-text-3 mono mt-0.5 truncate">
                                            {item.isCustom
                                                ? '—'
                                                : item.product.barcode ||
                                                  item.product.id.slice(0, 10)}
                                            <span className="ml-2 text-text-3">
                                                {formatCurrency(item.unitPrice)} ea
                                            </span>
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onRemove(item.product.id)}
                                        aria-label={`Remove ${item.product.name}`}
                                        className="p-1 -mt-0.5 -mr-1 rounded text-text-3 hover:text-danger hover:bg-danger-soft opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all focus:outline-none focus:ring-[3px] focus:ring-danger/20"
                                    >
                                        <X size={12} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </td>
                            <td className="px-1 py-3 text-center align-middle">
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
                                        value={item.quantity}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            if (v === '') return;
                                            const n = parseInt(v, 10);
                                            if (!Number.isNaN(n)) {
                                                onUpdateQuantity(item.product.id, n);
                                            }
                                        }}
                                        aria-label={`Quantity for ${item.product.name}`}
                                        className="w-7 h-6 text-center bg-transparent text-text-1 text-[13px] font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onUpdateQuantity(
                                                item.product.id,
                                                item.quantity + 1,
                                            )
                                        }
                                        aria-label="Increase quantity"
                                        className="w-6 h-6 rounded text-text-2 hover:text-text-1 hover:bg-primary-soft transition-colors flex items-center justify-center"
                                    >
                                        <Plus size={12} />
                                    </button>
                                </div>
                            </td>
                            <td className="px-5 py-3 text-right tabular-nums align-middle">
                                <span className="text-[13px] font-semibold text-text-1">
                                    {formatCurrency(item.lineTotal)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
