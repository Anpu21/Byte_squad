export interface IBrand {
  id: string
  name: string
  description: string | null
  color: string | null
  isActive: boolean
  sortOrder: number
  /** Null for brands auto-created from the product form's type-new datalist. */
  createdByUserId: string | null
  createdAt: string
  updatedAt: string
}
