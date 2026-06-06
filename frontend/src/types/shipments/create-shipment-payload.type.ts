/** Bundle approved transfer lines (same source + destination) into a shipment. */
export interface ICreateShipmentPayload {
  lineIds: string[]
  courierEmployeeId?: string
  etaHours?: number
}
