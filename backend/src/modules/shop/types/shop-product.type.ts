import { StockStatus } from '@/modules/shop/types/shop-stock-status.type';
import { ShopProductBranchRef } from '@/modules/shop/types/shop-product-branch-ref.type';
import { ShopSellableUnit } from '@/modules/shop/types/shop-sellable-unit.type';

export interface ShopProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  sellingPrice: number;
  imageUrl: string | null;
  baseUnit: string;
  sellableUnits: ShopSellableUnit[];
  stockStatus: StockStatus;
  availableBranches: ShopProductBranchRef[];
}
