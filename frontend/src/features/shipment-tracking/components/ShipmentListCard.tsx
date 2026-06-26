import { Link } from 'react-router-dom';
import { LuArrowRight as ArrowRight, LuClock as Clock, LuUser as User } from 'react-icons/lu';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { IShipment } from '@/types';
import ShipmentStatusPill from '@/components/transfers/ShipmentStatusPill';
import { formatEta } from '@/features/shipment-tracking/lib/shipment-format';

export function ShipmentListCard({ shipment }: { shipment: IShipment }) {
    const eta = formatEta(shipment.eta);
    return (
        <Link
            to={FRONTEND_ROUTES.SHIPMENT_DETAIL.replace(':id', shipment.id)}
            className="block border border-border rounded-xl bg-surface p-4 hover:bg-surface-2 transition-colors"
        >
            <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[13px] font-semibold text-text-1">
                    {shipment.trackingRef}
                </span>
                <ShipmentStatusPill status={shipment.status} />
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-text-1">
                <span>{shipment.sourceBranch.name}</span>
                <ArrowRight size={13} className="text-text-3" />
                <span>{shipment.destinationBranch.name}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-text-3">
                <span className="inline-flex items-center gap-1">
                    <User size={12} />
                    {shipment.courier?.fullName ?? 'No courier'}
                </span>
                {eta && (
                    <span className="inline-flex items-center gap-1">
                        <Clock size={12} />
                        ETA {eta}
                    </span>
                )}
                <span>
                    {shipment.lines.length} item
                    {shipment.lines.length === 1 ? '' : 's'}
                </span>
            </div>
        </Link>
    );
}
