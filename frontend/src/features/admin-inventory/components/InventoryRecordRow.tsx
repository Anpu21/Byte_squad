import { useNavigate } from 'react-router-dom';
import { ImageIcon, Pencil } from 'lucide-react';
import { FRONTEND_ROUTES } from '@/constants/routes';
import Pill from '@/components/ui/Pill';
import StatusPill from '@/components/ui/StatusPill';
import { formatCurrency } from '@/lib/utils';
import type { FlatRecord } from '../types/flat-record.type';

interface InventoryRecordRowProps {
    record: FlatRecord;
}

export function InventoryRecordRow({ record }: InventoryRecordRowProps) {
    const navigate = useNavigate();
    const { row, branch, cell, stockKey } = record;
    const stockEmpty = cell.quantity === 0;

    return (
        <tr className="group border-b border-border hover:bg-surface-2 transition-colors">
            <td className="px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-md bg-surface-2 border border-border overflow-hidden flex items-center justify-center flex-shrink-0">
                        <ImageIcon size={16} className="text-text-3" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm text-text-1 font-medium truncate">
                            {row.productName}
                        </p>
                        <p className="text-[11px] text-text-3 mono mt-0.5 truncate">
                            {row.barcode}
                        </p>
                    </div>
                </div>
            </td>

            <td className="px-4 py-3">
                <Pill tone="neutral" dot={false}>
                    {row.category}
                </Pill>
            </td>

            <td className="px-4 py-3">
                <Pill tone="info" dot={false}>
                    {branch.name}
                </Pill>
            </td>

            <td className="px-4 py-3">
                <StatusPill status={stockKey} />
            </td>

            <td className="px-4 py-3 text-right">
                <span
                    className={`mono text-sm font-semibold ${
                        stockEmpty ? 'text-text-3' : 'text-text-1'
                    }`}
                >
                    {cell.quantity}
                </span>
            </td>

            <td className="px-4 py-3 text-right">
                <span className="mono text-[12px] text-text-2">
                    {formatCurrency(Number(row.sellingPrice))}
                </span>
            </td>

            <td className="px-4 py-3 text-right">
                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            FRONTEND_ROUTES.INVENTORY_EDIT.replace(
                                ':productId',
                                row.productId,
                            ),
                        )
                    }
                    className="p-1.5 text-text-3 hover:text-text-1 rounded-md hover:bg-surface-2 transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    title="Edit product"
                    aria-label="Edit product"
                >
                    <Pencil size={14} />
                </button>
            </td>
        </tr>
    );
}
