export interface IBranch {
  id: string
  code: string
  name: string
  addressLine1: string
  addressLine2: string | null
  city: string | null
  state: string | null
  country: string | null
  postalCode: string | null
  phone: string
  email: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}
