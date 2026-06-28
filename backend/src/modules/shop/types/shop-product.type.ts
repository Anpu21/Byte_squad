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
  /** Average of visible reviews (0 when none); 0.00–5.00. */
  aggregateRating: number;
  reviewCount: number;
}
