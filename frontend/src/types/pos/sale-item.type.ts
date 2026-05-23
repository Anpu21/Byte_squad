import type { DiscountType } from '@/constants/enums';
import type { TPriceLevel } from './price-level.type';

export interface ISaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  baseUnitQty: number;
  unitId: string | null;
  unitPrice: number;
  discountAmount: number;
  discountType: DiscountType;
  lineTotal: number;
  priceLevelUsed: TPriceLevel;
  lineDiscountPercentage: number;
  lineSubtotal: number;
  lineTaxRate: number;
  lineTaxAmount: number;
  free: number;
  locationTakenFrom: string;
  status: 'Active' | 'Voided';
}
