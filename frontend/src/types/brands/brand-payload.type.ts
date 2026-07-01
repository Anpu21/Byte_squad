export interface ICreateBrandPayload {
  name: string
  description?: string
  color?: string
  sortOrder?: number
}

export interface IUpdateBrandPayload {
  name?: string
  description?: string
  color?: string
  sortOrder?: number
  isActive?: boolean
}
