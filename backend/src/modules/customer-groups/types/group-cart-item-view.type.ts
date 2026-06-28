/**
 * One shared-cart line resolved for display: live product name/image, the live
 * unit price, and the computed line total. Prices are resolved server-side on
 * every read — never stored — so the cart always reflects current pricing.
 */
export interface GroupCartItemView {
  id: string;
  productId: string;
  productName: string;
  imageUrl: string | null;
  branchId: string;
  branchName: string;
  unitId: string | null;
  unitLabel: string;
  unitPrice: number;
  quantity: number;
  /** Firm cash for a "buy by amount" line; null for normal lines. */
  amount: number | null;
  lineTotal: number;
  /** False when the product has since been deactivated (checkout will reject). */
  available: boolean;
  addedByUserId: string;
}
