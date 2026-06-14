/** Minimal courier view (the WORKER's HR employee) carried on a shipment. */
export interface IShipmentCourierSummary {
  id: string
  fullName: string
  employeeCode: string
  contactPhone: string
  userId: string | null
}
