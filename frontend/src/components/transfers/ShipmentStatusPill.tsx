import { ShipmentStatus } from '@/constants/enums';
import { SHIPMENT_STATUS_LABELS } from '@/features/shipment-tracking/lib/shipment-format';

const STYLES: Record<ShipmentStatus, string> = {
    [ShipmentStatus.PENDING]: 'bg-surface-2 text-text-2 border-border',
    [ShipmentStatus.READY_TO_SHIP]:
        'bg-primary-soft text-primary-soft-text border-primary/30',
    [ShipmentStatus.DISPATCHED]:
        'bg-warning-soft text-warning border-warning/40',
    [ShipmentStatus.OUT_FOR_DELIVERY]:
        'bg-warning-soft text-warning border-warning/40 border-dashed',
    [ShipmentStatus.DELIVERED]:
        'bg-accent-soft text-accent-text border-accent/40',
    [ShipmentStatus.CANCELLED]:
        'bg-transparent text-text-3 border-border border-dashed',
    [ShipmentStatus.RETURNED]:
        'bg-danger-soft text-danger border-danger/40 border-dashed',
};

export default function ShipmentStatusPill({
    status,
}: {
    status: ShipmentStatus;
}) {
    return (
        <span
            className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium border ${STYLES[status]}`}
        >
            {SHIPMENT_STATUS_LABELS[status]}
        </span>
    );
}
