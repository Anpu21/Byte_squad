export interface IBranchCreatePayload {
  code: string
  name: string
  addressLine1: string
  addressLine2?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  phone?: string
  email?: string
}
