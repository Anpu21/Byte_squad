import { ShipmentStatus } from '@common/enums/shipment-status.enum';
import { ShipmentEventType } from '@common/enums/shipment-event-type.enum';

/**
 * The ordered tracking-timeline a demo shipment in a given status has
 * accumulated, used by the seed to append one `ShipmentEvent` per entry.
 *
 * Pure + deterministic so `AdminSeedService.ensureShipments` can stamp each
 * event with a back-dated `createdAt`, and a unit test can assert the shape.
 * Mirrors the real transitions in `shipments.service.ts`: every shipment
 * starts `CREATED`; in-transit states carry a `CHECKPOINT` waypoint; the
 * terminal states (`DELIVERED` / `RETURNED` / `CANCELLED`) end on their own
 * event.
 */
const TIMELINES: Record<ShipmentStatus, ShipmentEventType[]> = {
  [ShipmentStatus.PENDING]: [ShipmentEventType.CREATED],
  [ShipmentStatus.READY_TO_SHIP]: [
    ShipmentEventType.CREATED,
    ShipmentEventType.COURIER_ASSIGNED,
    ShipmentEventType.READY_TO_SHIP,
  ],
  [ShipmentStatus.DISPATCHED]: [
    ShipmentEventType.CREATED,
    ShipmentEventType.COURIER_ASSIGNED,
    ShipmentEventType.READY_TO_SHIP,
    ShipmentEventType.DISPATCHED,
    ShipmentEventType.CHECKPOINT,
  ],
  [ShipmentStatus.OUT_FOR_DELIVERY]: [
    ShipmentEventType.CREATED,
    ShipmentEventType.COURIER_ASSIGNED,
    ShipmentEventType.READY_TO_SHIP,
    ShipmentEventType.DISPATCHED,
    ShipmentEventType.CHECKPOINT,
    ShipmentEventType.OUT_FOR_DELIVERY,
  ],
  [ShipmentStatus.DELIVERED]: [
    ShipmentEventType.CREATED,
    ShipmentEventType.COURIER_ASSIGNED,
    ShipmentEventType.READY_TO_SHIP,
    ShipmentEventType.DISPATCHED,
    ShipmentEventType.CHECKPOINT,
    ShipmentEventType.OUT_FOR_DELIVERY,
    ShipmentEventType.DELIVERED,
  ],
  [ShipmentStatus.CANCELLED]: [
    ShipmentEventType.CREATED,
    ShipmentEventType.CANCELLED,
  ],
  [ShipmentStatus.RETURNED]: [
    ShipmentEventType.CREATED,
    ShipmentEventType.COURIER_ASSIGNED,
    ShipmentEventType.READY_TO_SHIP,
    ShipmentEventType.DISPATCHED,
    ShipmentEventType.CHECKPOINT,
    ShipmentEventType.RETURNED,
  ],
};

/** Ordered event timeline for a demo shipment in `status` (a fresh copy). */
export function eventsForStatus(status: ShipmentStatus): ShipmentEventType[] {
  return [...TIMELINES[status]];
}
