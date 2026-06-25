/**
 * Branch-scoped inventory snapshot for a single product. Returned by
 * `InventoryRepository.summaryForProduct(productId, branchId)`. The POS
 * layer maps this into the public `InventoryQuantity` shape consumed by
 * the cashier UI; this type stays inside the inventory module so the
 * repository doesn't depend on POS types.
 */
export interface InventorySummaryForProduct {
  productId: string;
  branchId: string;
  branchName: string;
  branchQty: number;
  totalAcrossBranches: number;
}
