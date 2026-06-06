export interface ICategory {
  id: string
  name: string
  description: string | null
  color: string | null
  isActive: boolean
  sortOrder: number
  createdByUserId: string
  createdAt: string
  updatedAt: string
}
