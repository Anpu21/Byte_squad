import type { IInventory } from '@/types/inventory/inventory.type'
import type { IProduct } from '@/types/product/product.type'

export interface IInventoryWithProduct extends IInventory {
  product: IProduct
}
