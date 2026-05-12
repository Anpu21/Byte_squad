import { useNavigate } from 'react-router-dom';
import { ImageIcon, Pencil } from 'lucide-react';
import { FRONTEND_ROUTES } from '@/constants/routes';
import Card from '@/components/ui/Card';
import Pill from '@/components/ui/Pill';
import StatusPill from '@/components/ui/StatusPill';
import { formatCurrency } from '@/lib/utils';
import type { FlatRecord } from '../types/flat-record.type';

interface InventoryRecordCardProps {
    record: FlatRecord;
}

export function InventoryRecordCard({ record }: InventoryRecordCardProps) {
    const navigate = useNavigate();
    const { row, branch, cell, stockKey } = record;
    const stockEmpty = cell.quantity === 0;

    return (
        <Card className="group p-3 hover:border-border-strong hover:bg-surface-2 transition-colors">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-md bg-surface-2 border border-border overflow-hidden flex items-center justify-center flex-shrink-0">
                    <ImageIcon size={18} className="text-text-3" />
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-1 font-medium truncate">
                        {row.productName}
                    </p>
                    <p className="text-[11px] text-text-3 mono mt-0.5 truncate">
                        {row.barcode}
                    </p>
                </div>

                <div className="flex-shrink-0 hidden md:block">
                    <Pill tone="neutral" dot={false}>
                        {row.category}
                    </Pill>
                </div>

                <div className="flex-shrink-0 hidden sm:block">
                    <Pill tone="info" dot={false}>
                        {branch.name}
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
                        {cell.quantity}
                    </p>
                    <p className="mono text-[11px] text-text-3 mt-0.5">
                        {formatCurrency(Number(row.sellingPrice))}
                    </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
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
                        className="p-1.5 text-text-3 hover:text-text-1 rounded-md hover:bg-surface-2 transition-colors"
                        title="Edit product"
                        aria-label="Edit product"
                    >
                        <Pencil size={14} />
                    </button>
                </div>
            </div>
        </Card>
    );
}
