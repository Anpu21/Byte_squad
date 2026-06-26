import { LuArrowRight as ArrowRight, LuClock as Clock, LuTruck as Truck, LuUser as User } from 'react-icons/lu';
import type { IShipment } from '@/types';
import ShipmentStatusPill from '@/components/transfers/ShipmentStatusPill';
import { formatEta } from '@/features/shipment-tracking/lib/shipment-format';

export function ShipmentHeader({ shipment }: { shipment: IShipment }) {
    const eta = formatEta(shipment.eta);
    return (
        <div className="border border-border rounded-xl bg-surface p-5 mb-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <Truck size={18} className="text-text-3" />
                    <span className="font-mono text-sm font-semibold text-text-1">
                        {shipment.trackingRef}
                    </span>
                </div>
                <ShipmentStatusPill status={shipment.status} />
            </div>

            <div className="flex items-center gap-2 mt-3 text-sm text-text-1">
                <span className="font-medium">{shipment.sourceBranch.name}</span>
                <ArrowRight size={14} className="text-text-3" />
                <span className="font-medium">
                    {shipment.destinationBranch.name}
                </span>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs text-text-2">
                <span className="inline-flex items-center gap-1.5">
                    <User size={13} className="text-text-3" />
                    {shipment.courier
                        ? shipment.courier.fullName
                        : 'No courier assigned'}
                </span>
                {eta && (
                    <span className="inline-flex items-center gap-1.5">
                        <Clock size={13} className="text-text-3" />
                        ETA {eta}
                    </span>
                )}
                <span>
                    {shipment.lines.length} item
                    {shipment.lines.length === 1 ? '' : 's'}
                </span>
            </div>

            {shipment.exceptionReason && (
                <p className="mt-3 text-xs text-danger">
                    {shipment.exceptionReason}
                </p>
            )}
        </div>
    );
}
