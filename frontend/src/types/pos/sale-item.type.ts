import type { DiscountType } from '@/constants/enums';
import type { TPriceLevel } from './price-level.type';

/**
 * Trimmed product snapshot the backend eager-loads onto `SaleItem.product`.
 * The bill template needs the display name; pulling the full Product entity
 * would force the print layer to depend on product shape unnecessarily.
 */
export interface ISaleItemProductSnapshot {
  id: string;
  name: string;
}

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
  product?: ISaleItemProductSnapshot | null;
}
