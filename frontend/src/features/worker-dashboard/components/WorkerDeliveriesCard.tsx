import { Link } from 'react-router-dom';
import { ArrowRight, Truck } from 'lucide-react';
import KpiCard from '@/components/ui/KpiCard';
import ShipmentStatusPill from '@/components/transfers/ShipmentStatusPill';
import { ShipmentStatus } from '@/constants/enums';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { IShipment } from '@/types';

const ACTIVE = new Set<ShipmentStatus>([
    ShipmentStatus.PENDING,
    ShipmentStatus.READY_TO_SHIP,
    ShipmentStatus.DISPATCHED,
    ShipmentStatus.OUT_FOR_DELIVERY,
]);

/**
 * Delivery half of the worker home — KPIs + a peek at active parcels, so the
 * worker sees attendance and courier work side by side. Computed from the
 * worker's own (server-scoped) shipment list; no extra endpoint.
 */
export function WorkerDeliveriesCard({ shipments }: { shipments: IShipment[] }) {
    const active = shipments.filter((s) => ACTIVE.has(s.status));
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
        <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-text-1">My deliveries</h2>
                <Link
                    to={FRONTEND_ROUTES.SHIPMENTS}
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                    View all <ArrowRight size={12} />
                </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
                <KpiCard
                    label="Active"
                    value={active.length}
                    icon={<Truck size={15} />}
                />
                <KpiCard label="Delivered" value={delivered.length} />
                <KpiCard
                    label="On-time"
                    value={onTimePct != null ? `${onTimePct}%` : '—'}
                />
            </div>

            {active.length > 0 && (
                <div className="border border-border rounded-md bg-surface divide-y divide-border">
                    {active.slice(0, 5).map((shipment) => (
                        <Link
                            key={shipment.id}
                            to={FRONTEND_ROUTES.SHIPMENT_DETAIL.replace(
                                ':id',
                                shipment.id,
                            )}
                            className="flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-surface-2 transition-colors"
                        >
                            <span className="font-mono text-[12px] text-text-1">
                                {shipment.trackingRef}
                            </span>
                            <span className="text-xs text-text-2 truncate flex-1 px-2">
                                {shipment.sourceBranch.name} →{' '}
                                {shipment.destinationBranch.name}
                            </span>
                            <ShipmentStatusPill status={shipment.status} />
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
