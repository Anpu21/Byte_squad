import type { IStockTransferRequest } from '@/types';
import { AdminTransferRow } from './AdminTransferRow';

const HEADERS = [
    { label: 'Product', align: 'left' },
    { label: 'Destination', align: 'left' },
    { label: 'Source', align: 'left' },
    { label: 'Qty', align: 'right' },
    { label: 'Status', align: 'left' },
    { label: 'Requested', align: 'left' },
    { label: '', align: 'right' },
] as const;

interface AdminTransfersTableProps {
    items: IStockTransferRequest[];
    isLoading: boolean;
}

export function AdminTransfersTable({
    items,
    isLoading,
}: AdminTransfersTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-border text-[11px] uppercase tracking-widest text-text-3 bg-canvas/50">
                        {HEADERS.map((h, i) => (
                            <th
                                key={i}
                                className={`px-6 py-4 font-semibold whitespace-nowrap ${
                                    h.align === 'right' ? 'text-right' : ''
                                }`}
                            >
                                {h.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {isLoading ? (
                        [...Array(4)].map((_, i) => (
                            <tr key={i} className="border-b border-border">
                                {[...Array(HEADERS.length)].map((__, j) => (
                                    <td key={j} className="px-6 py-4">
                                        <div className="h-5 w-24 bg-surface-2 rounded animate-pulse" />
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : items.length === 0 ? (
                        <tr>
                            <td
                                colSpan={HEADERS.length}
                                className="px-6 py-16 text-center"
                            >
                                <p className="text-sm font-medium text-text-2">
                                    No transfers in this view
                                </p>
                            </td>
                        </tr>
                    ) : (
                        items.map((item) => (
                            <AdminTransferRow key={item.id} transfer={item} />
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
