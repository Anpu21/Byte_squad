import { useNavigate } from 'react-router-dom';
import { ImageIcon, Pencil, Trash2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Pill from '@/components/ui/Pill';
import StatusPill from '@/components/ui/StatusPill';
import { formatCurrency } from '@/lib/utils';
import type { IInventoryWithProduct } from '@/types';
import { getStockKey } from '../lib/stock-key';

interface InventoryRowProps {
    item: IInventoryWithProduct;
    onDelete: (item: IInventoryWithProduct) => void;
}

export function InventoryRow({ item, onDelete }: InventoryRowProps) {
    const navigate = useNavigate();
    const stockKey = getStockKey(item);
    const stockEmpty = item.quantity === 0;

    return (
        <Card className="group p-3 hover:border-border-strong hover:bg-surface-2 transition-colors">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-md bg-surface-2 border border-border overflow-hidden flex items-center justify-center flex-shrink-0">
                    {item.product.imageUrl ? (
                        <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <ImageIcon size={18} className="text-text-3" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-1 font-medium truncate">
                        {item.product.name}
                    </p>
                    <p className="text-[11px] text-text-3 mono mt-0.5 truncate">
                        {item.product.barcode}
                    </p>
                </div>

                <div className="flex-shrink-0 hidden sm:block">
                    <Pill tone="neutral" dot={false}>
                        {item.product.category}
                    </Pill>
                </div>

                <div className="flex-shrink-0">
                    <StatusPill status={stockKey} />
                </div>

                <div className="flex flex-col items-end flex-shrink-0 w-20">
                    <p
                        className={`mono text-sm font-semibold ${
                            stockEmpty ? 'text-text-3' : 'text-text-1'
                        }`}
                    >
                        {item.quantity}
                    </p>
                    <p className="mono text-[11px] text-text-3 mt-0.5">
                        {formatCurrency(Number(item.product.sellingPrice))}
                    </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                        type="button"
                        onClick={() =>
                            navigate(`/inventory/edit/${item.productId}`)
                        }
                        className="p-1.5 text-text-3 hover:text-text-1 rounded-md hover:bg-surface-2 transition-colors"
                        title="Edit"
                        aria-label="Edit"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="p-1.5 text-text-3 hover:text-danger rounded-md hover:bg-danger-soft transition-colors"
                        title="Delete"
                        aria-label="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </Card>
    );
}
