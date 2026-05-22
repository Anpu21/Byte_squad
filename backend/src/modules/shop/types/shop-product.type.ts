import { StockStatus } from '@/modules/shop/types/shop-stock-status.type';
import { ShopProductBranchRef } from '@/modules/shop/types/shop-product-branch-ref.type';

export interface ShopProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  sellingPrice: number;
  imageUrl: string | null;
  stockStatus: StockStatus;
  availableBranches: ShopProductBranchRef[];
}
