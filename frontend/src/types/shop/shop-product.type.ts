import type { ShopStockStatus } from '@/types/shop/shop-stock-status.type'
import type { IShopProductBranchRef } from '@/types/shop/shop-product-branch-ref.type'
import type { IShopSellableUnit } from '@/types/shop/shop-sellable-unit.type'

export interface IShopProduct {
  id: string
  name: string
  description: string | null
  category: string
  sellingPrice: number
  imageUrl: string | null
  baseUnit: string
  sellableUnits: IShopSellableUnit[]
  stockStatus: ShopStockStatus
  availableBranches: IShopProductBranchRef[]
  aggregateRating: number
  reviewCount: number
}
