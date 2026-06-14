/**
 * Delivery lifecycle for a {@link Shipment} — a courier-driven parcel that
 * groups one or more approved stock-transfer lines from one source branch to
 * one destination branch.
 *
 * Stock moves in two beats, mirroring the existing transfer model: it is
 * decremented from the source at DISPATCHED and credited to the destination at
 * DELIVERED. The window between is a real in-transit limbo. RETURNED is the
 * post-dispatch escape hatch that re-credits the source (audit finding F4);
 * CANCELLED is only reachable pre-dispatch, before any stock has moved.
 */
export enum ShipmentStatus {
  /** Formed from approved lines, courier not yet assigned / not sent. */
  PENDING = 'pending',
  /** Picked + packed, courier assigned, awaiting dispatch. */
  READY_TO_SHIP = 'ready_to_ship',
  /** Left the source — source stock decremented; in transit. */
  DISPATCHED = 'dispatched',
  /** Arrived at the destination branch, awaiting check-in. */
  OUT_FOR_DELIVERY = 'out_for_delivery',
  /** Received at destination — destination stock credited. Terminal. */
  DELIVERED = 'delivered',
  /** Aborted before dispatch; no stock moved. Terminal. */
  CANCELLED = 'cancelled',
  /** Aborted after dispatch; source stock re-credited. Terminal. */
  RETURNED = 'returned',
}

/** Statuses past which no further transition is allowed. */
export const SHIPMENT_TERMINAL_STATUSES: ReadonlyArray<ShipmentStatus> = [
  ShipmentStatus.DELIVERED,
  ShipmentStatus.CANCELLED,
  ShipmentStatus.RETURNED,
];
