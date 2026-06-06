import type { ShipmentEventType } from '@/constants/enums'

/** One append-only entry on a shipment's tracking timeline. */
export interface IShipmentEvent {
  id: string
  shipmentId: string
  type: ShipmentEventType
  location: string | null
  note: string | null
  actorUserId: string | null
  actor: { id: string; firstName: string; lastName: string } | null
  createdAt: string
}
