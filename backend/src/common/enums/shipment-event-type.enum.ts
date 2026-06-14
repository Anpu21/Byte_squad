/**
 * The kinds of checkpoint that land on a shipment's tracking timeline
 * (`shipment_events`). Most map 1:1 to a status transition; CHECKPOINT is the
 * free-form waypoint scan (location + note) a courier can append while a
 * shipment is in transit, the way a parcel-tracking feed shows intermediate
 * facility scans without changing the headline status.
 */
export enum ShipmentEventType {
  CREATED = 'created',
  COURIER_ASSIGNED = 'courier_assigned',
  READY_TO_SHIP = 'ready_to_ship',
  DISPATCHED = 'dispatched',
  CHECKPOINT = 'checkpoint',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  RETURNED = 'returned',
  CANCELLED = 'cancelled',
}
