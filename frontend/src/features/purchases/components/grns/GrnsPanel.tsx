import { useState } from 'react';
import Card from '@/components/ui/Card';
import type { GrnPaymentStatus, GrnStatus, IGrn } from '@/types';
import { useGrns } from '../../hooks/useGrns';
import { useSuppliers } from '../../hooks/useSuppliers';
import { GrnsTable } from './GrnsTable';
import { GrnDetailModal } from './GrnDetailModal';

const INPUT_CLASS =
    'h-9 px-3 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-colors';

/**
 * Goods-receipts register: filter by supplier / status / payment state,
 * drill into a GRN, void from the detail (admin). Managers see only their
 * branch (server-pinned).
 */
export function GrnsPanel() {
    const [supplierId, setSupplierId] = useState('');
    const [status, setStatus] = useState<'' | GrnStatus>('');
    const [paymentStatus, setPaymentStatus] = useState<'' | GrnPaymentStatus>(
        '',
    );
    const [viewId, setViewId] = useState<string | null>(null);

    const suppliersQuery = useSuppliers({ limit: 100 });
    const grnsQuery = useGrns({
        supplierId: supplierId || undefined,
        status: status || undefined,
        paymentStatus: paymentStatus || undefined,
        limit: 100,
        offset: 0,
    });
    const rows = grnsQuery.data?.rows ?? [];

    return (
        <>
            <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border">
                    <select
                        className={INPUT_CLASS}
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                        aria-label="Filter by supplier"
                    >
                        <option value="">All suppliers</option>
                        {(suppliersQuery.data?.rows ?? []).map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                    <select
                        className={INPUT_CLASS}
                        value={status}
                        onChange={(e) =>
                            setStatus(e.target.value as '' | GrnStatus)
                        }
                        aria-label="Filter by status"
                    >
                        <option value="">All statuses</option>
                        <option value="Received">Received</option>
                        <option value="Voided">Voided</option>
                    </select>
                    <select
                        className={INPUT_CLASS}
                        value={paymentStatus}
                        onChange={(e) =>
                            setPaymentStatus(
                                e.target.value as '' | GrnPaymentStatus,
                            )
                        }
                        aria-label="Filter by payment status"
                    >
                        <option value="">All payment states</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Partially_Paid">Partially paid</option>
                        <option value="Paid">Paid</option>
                    </select>
                </div>
                <GrnsTable
                    rows={rows}
                    isLoading={grnsQuery.isLoading}
                    onView={(grn: IGrn) => setViewId(grn.id)}
                />
            </Card>
            <GrnDetailModal grnId={viewId} onClose={() => setViewId(null)} />
        </>
    );
}
