import type { DiscountType } from '@/constants/enums';
import type { TPriceLevel } from './price-level.type';

/**
 * Trimmed product snapshot the backend eager-loads onto `SaleItem.product`.
 * The bill template needs the display name; pulling the full Product entity
 * would force the print layer to depend on product shape unnecessarily.
 * `baseUnit` is the canonical stock-keeping unit (e.g. "kg", "L", "each")
 * so the receipt can fall back to "/kg" when the picked sellable-unit name
 * isn't on the row.
 */
export interface ISaleItemProductSnapshot {
  id: string;
  name: string;
  baseUnit?: string;
}

/**
 * Sellable-unit snapshot eager-loaded onto `SaleItem.unit` for non-base
 * lines (`unitId !== null`). Optional because the eager-load was not in the
 * Phase 2 surface; receipts gracefully fall back to `product.baseUnit` when
 * the backend hasn't yet been updated to include the relation.
 */
export interface ISaleItemUnitSnapshot {
  id: string;
  name: string;
  conversionToBase: number;
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
  unit?: ISaleItemUnitSnapshot | null;
}
