import { type IconType as LucideIcon } from 'react-icons';
import { LuCircleCheckBig as CheckCircle2, LuMapPin as MapPin, LuNavigation as Navigation, LuPackage as Package, LuPackageCheck as PackageCheck, LuTruck as Truck, LuUndo2 as Undo2, LuUserCheck as UserCheck, LuCircleX as XCircle } from 'react-icons/lu';
import { ShipmentEventType } from '@/constants/enums';
import type { IShipmentEvent } from '@/types';
import {
    SHIPMENT_EVENT_LABELS,
    formatStamp,
} from '@/features/shipment-tracking/lib/shipment-format';

const ICONS: Record<ShipmentEventType, LucideIcon> = {
    [ShipmentEventType.CREATED]: Package,
    [ShipmentEventType.COURIER_ASSIGNED]: UserCheck,
    [ShipmentEventType.READY_TO_SHIP]: PackageCheck,
    [ShipmentEventType.DISPATCHED]: Truck,
    [ShipmentEventType.CHECKPOINT]: MapPin,
    [ShipmentEventType.OUT_FOR_DELIVERY]: Navigation,
    [ShipmentEventType.DELIVERED]: CheckCircle2,
    [ShipmentEventType.RETURNED]: Undo2,
    [ShipmentEventType.CANCELLED]: XCircle,
};

/**
 * Parcel-tracking feed: every shipment event in order, newest at the bottom,
 * with a connected rail. Models the AliExpress logistics timeline.
 */
export function ShipmentTimeline({ events }: { events: IShipmentEvent[] }) {
    return (
        <div className="border border-border rounded-xl bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-1 mb-4">Tracking</h3>
            {events.length === 0 ? (
                <p className="text-sm text-text-3">No tracking updates yet.</p>
            ) : (
                <ol className="relative">
                    {events.map((event, i) => {
                        const Icon = ICONS[event.type] ?? Package;
                        const isLast = i === events.length - 1;
                        return (
                            <li
                                key={event.id}
                                className="relative flex gap-3 pb-5 last:pb-0"
                            >
                                {!isLast && (
                                    <span
                                        className="absolute left-[11px] top-6 bottom-0 w-px bg-primary/40"
                                        aria-hidden="true"
                                    />
                                )}
                                <span
                                    className={`relative z-10 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        isLast
                                            ? 'bg-primary text-text-inv'
                                            : 'bg-primary-soft text-primary-soft-text'
                                    }`}
                                >
                                    <Icon size={13} />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[13px] font-medium text-text-1">
                                        {SHIPMENT_EVENT_LABELS[event.type]}
                                        {event.location ? ` · ${event.location}` : ''}
                                    </p>
                                    {event.note && (
                                        <p className="text-xs text-text-2 mt-0.5">
                                            {event.note}
                                        </p>
                                    )}
                                    <p className="text-xs text-text-3 mt-0.5">
                                        {formatStamp(event.createdAt)}
                                        {event.actor
                                            ? ` · ${event.actor.firstName} ${event.actor.lastName}`
                                            : ''}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            )}
        </div>
    );
}
