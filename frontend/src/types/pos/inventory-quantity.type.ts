/**
 * Inventory snapshot for a single product at the cashier's branch plus
 * the cross-branch total, returned by `GET /pos/products/:productId/inventory`.
 *
 * Non-admin actors see `branchQty` scoped to their own branch; admins may
 * have `branchQty` reflect any branch's row (the service decides the scope).
 * `totalAcrossBranches` is always the sum over every inventory row.
 */
export interface IInventoryQuantity {
  productId: string;
  branchId: string;
  branchName: string;
  branchQty: number;
  totalAcrossBranches: number;
}
