/**
 * Aggregated best-seller row the admin dashboard "top products" card binds
 * to. Mirrors `backend/src/modules/pos/types/top-product.type.ts`.
 */
export interface ITopProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}
