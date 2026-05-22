import type { ShopStockStatus } from '@/types/shop/shop-stock-status.type'
import type { IShopProductBranchRef } from '@/types/shop/shop-product-branch-ref.type'

export interface IShopProduct {
  id: string
  name: string
  description: string | null
  category: string
  sellingPrice: number
  imageUrl: string | null
  stockStatus: ShopStockStatus
  availableBranches: IShopProductBranchRef[]
}
