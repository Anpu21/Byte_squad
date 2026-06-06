import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import { ShipmentStatus, UserRole } from '@/constants/enums';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { useShipmentsQuery } from '@/features/shipment-tracking/hooks/useShipmentsQuery';
import { useStockTransferRealtime } from '@/hooks/useStockTransferRealtime';
import { ShipmentListCard } from '@/features/shipment-tracking/components/ShipmentListCard';
import { ShipmentsSummary } from '@/features/shipment-tracking/components/ShipmentsSummary';
import { SHIPMENT_STATUS_LABELS } from '@/features/shipment-tracking/lib/shipment-format';

const FILTERS: Array<ShipmentStatus | 'all'> = [
    'all',
    ShipmentStatus.PENDING,
    ShipmentStatus.READY_TO_SHIP,
    ShipmentStatus.DISPATCHED,
    ShipmentStatus.OUT_FOR_DELIVERY,
    ShipmentStatus.DELIVERED,
];

function chipClass(active: boolean): string {
    return `px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
        active
            ? 'bg-primary text-text-inv border-primary'
            : 'bg-surface text-text-2 border-border hover:bg-surface-2'
    }`;
}

export function ShipmentsListPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    useStockTransferRealtime();
    const [status, setStatus] = useState<ShipmentStatus | 'all'>('all');
    // Fetch a wide page once, then filter the chips client-side so the
    // summary KPIs stay accurate regardless of the active chip.
    const { data, isLoading } = useShipmentsQuery({ limit: 100 });

    const isWorker = user?.role === UserRole.WORKER;
    const canCreate =
        user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;
    const allItems = data?.items ?? [];
    const items =
        status === 'all'
            ? allItems
            : allItems.filter((s) => s.status === status);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                    <h1 className="text-[28px] font-bold tracking-[-0.02em] text-text-1">
                        {isWorker ? 'My deliveries' : 'Shipments'}
                    </h1>
                    <p className="text-xs text-text-2 mt-1">
                        {isWorker
                            ? 'Parcels assigned to you to deliver'
                            : 'Courier shipments across your branches'}
                    </p>
                </div>
                {canCreate && (
                    <Button onClick={() => navigate(FRONTEND_ROUTES.SHIPMENT_NEW)}>
                        <Plus size={16} /> New shipment
                    </Button>
                )}
            </div>

            <ShipmentsSummary shipments={allItems} />

            <div className="flex flex-wrap gap-1.5 mb-4">
                {FILTERS.map((f) => (
                    <button
                        key={f}
                        onClick={() => setStatus(f)}
                        className={chipClass(status === f)}
                    >
                        {f === 'all' ? 'All' : SHIPMENT_STATUS_LABELS[f]}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-[40vh]">
                    <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
                </div>
            ) : items.length === 0 ? (
                <div className="border border-border rounded-xl bg-surface p-10 text-center text-sm text-text-3">
                    No shipments to show.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((shipment) => (
                        <ShipmentListCard key={shipment.id} shipment={shipment} />
                    ))}
                </div>
            )}
        </div>
    );
}
