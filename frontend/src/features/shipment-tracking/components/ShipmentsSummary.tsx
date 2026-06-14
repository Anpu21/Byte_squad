import KpiCard from '@/components/ui/KpiCard';
import { ShipmentStatus } from '@/constants/enums';
import type { IShipment } from '@/types';

/** At-a-glance delivery health computed from the loaded shipment list. */
export function ShipmentsSummary({ shipments }: { shipments: IShipment[] }) {
    const awaiting = shipments.filter(
        (s) =>
            s.status === ShipmentStatus.PENDING ||
            s.status === ShipmentStatus.READY_TO_SHIP,
    ).length;
    const inTransit = shipments.filter(
        (s) =>
            s.status === ShipmentStatus.DISPATCHED ||
            s.status === ShipmentStatus.OUT_FOR_DELIVERY,
    ).length;
    const delivered = shipments.filter(
        (s) => s.status === ShipmentStatus.DELIVERED,
    );
    const withEta = delivered.filter((s) => s.eta && s.deliveredAt);
    const onTime = withEta.filter(
        (s) => new Date(s.deliveredAt as string) <= new Date(s.eta as string),
    ).length;
    const onTimePct = withEta.length
        ? Math.round((onTime / withEta.length) * 100)
        : null;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <KpiCard label="Awaiting dispatch" value={awaiting} />
            <KpiCard label="In transit" value={inTransit} />
            <KpiCard label="Delivered" value={delivered.length} />
            <KpiCard
                label="On-time"
                value={onTimePct != null ? `${onTimePct}%` : '—'}
            />
        </div>
    );
}
