import { ShipmentStatus, ShipmentEventType } from '@/constants/enums';

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
    [ShipmentStatus.PENDING]: 'Pending',
    [ShipmentStatus.READY_TO_SHIP]: 'Ready to ship',
    [ShipmentStatus.DISPATCHED]: 'Dispatched',
    [ShipmentStatus.OUT_FOR_DELIVERY]: 'Out for delivery',
    [ShipmentStatus.DELIVERED]: 'Delivered',
    [ShipmentStatus.CANCELLED]: 'Cancelled',
    [ShipmentStatus.RETURNED]: 'Returned',
};

export const SHIPMENT_EVENT_LABELS: Record<ShipmentEventType, string> = {
    [ShipmentEventType.CREATED]: 'Shipment created',
    [ShipmentEventType.COURIER_ASSIGNED]: 'Courier assigned',
    [ShipmentEventType.READY_TO_SHIP]: 'Ready to ship',
    [ShipmentEventType.DISPATCHED]: 'Dispatched',
    [ShipmentEventType.CHECKPOINT]: 'In transit',
    [ShipmentEventType.OUT_FOR_DELIVERY]: 'Out for delivery',
    [ShipmentEventType.DELIVERED]: 'Delivered',
    [ShipmentEventType.RETURNED]: 'Returned',
    [ShipmentEventType.CANCELLED]: 'Cancelled',
};

export function formatStamp(ts?: string | null): string {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/** ETA as a friendly relative-ish label, or null when none/past. */
export function formatEta(iso: string | null): string | null {
    if (!iso) return null;
    return new Date(iso).toLocaleString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}
