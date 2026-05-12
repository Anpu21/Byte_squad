import { MapPin, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { ICustomerRequest } from '@/types';
import { STATUS_LABEL, STATUS_TONE } from '../lib/status-style';

interface RequestSummaryPanelProps {
    request: ICustomerRequest;
}

export function RequestSummaryPanel({ request }: RequestSummaryPanelProps) {
    return (
        <div className="bg-surface border border-border rounded-md p-6">
            <div className="flex items-center justify-between mb-4">
                <span
                    className={`text-[11px] uppercase tracking-widest px-2 py-1 rounded-full border ${STATUS_TONE[request.status]}`}
                >
                    {STATUS_LABEL[request.status]}
                </span>
                <span className="text-[11px] text-text-3">
                    {new Date(request.createdAt).toLocaleString()}
                </span>
            </div>

            {request.branch && (
                <div className="mb-4 flex items-start gap-2 text-sm">
                    <MapPin size={14} className="mt-0.5 text-text-3" />
                    <div>
                        <p className="font-semibold text-text-1">
                            {request.branch.name}
                        </p>
                        <p className="text-text-2 text-xs mt-0.5">
                            {request.branch.address}
                        </p>
                    </div>
                </div>
            )}

            <div className="mb-4">
                <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-widest text-text-3">
                    <Package size={12} /> Items
                </div>
                <div className="space-y-1.5 text-sm">
                    {request.items.map((it) => (
                        <div
                            key={it.id}
                            className="flex items-center justify-between text-text-1"
                        >
                            <span className="truncate pr-2">
                                {it.product?.name ?? 'Unknown'} × {it.quantity}
                            </span>
                            <span>
                                {formatCurrency(
                                    it.unitPriceSnapshot * it.quantity,
                                )}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-text-3">
                    Estimated total
                </span>
                <span className="text-lg font-bold text-text-1">
                    {formatCurrency(request.estimatedTotal)}
                </span>
            </div>

            {request.note && (
                <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs uppercase tracking-widest text-text-3 mb-1">
                        Note
                    </p>
                    <p className="text-sm text-text-1">{request.note}</p>
                </div>
            )}
        </div>
    );
}
