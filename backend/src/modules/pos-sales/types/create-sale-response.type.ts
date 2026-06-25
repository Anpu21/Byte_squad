import type { Sale } from '@/modules/pos-sales/entities/sale.entity';

/**
 * Optional loyalty side-effect summary attached to the createSale
 * response when the cashier linked the sale to either a registered
 * customer (`customerUserId`) or a walk-in (`loyaltyCustomerId`).
 *
 * `earned` and `redeemed` are point counts written to the wallet
 * during the same transaction as the sale; `newBalance` is the
 * wallet balance after both writes settled. `redeemValue` is the
 * money value of the redeemed points (`redeemed * pointValue`) that
 * was deducted from the cash the customer handed over, so the receipt
 * can print the "Points redeemed −Rs X" line without re-deriving it.
 */
export interface CreateSaleLoyaltyResult {
  ownerType: 'user' | 'walkIn';
  earned: number;
  redeemed: number;
  redeemValue: number;
  newBalance: number;
}

/**
 * Wire-format returned by `POST /pos/sales`. The persisted Sale row
 * stays the primary payload (so existing consumers keep working);
 * the optional `loyalty` field carries the wallet side-effect
 * summary when the sale was attributed to a loyalty owner.
 */
export type CreateSaleResponse = Sale & {
  loyalty?: CreateSaleLoyaltyResult;
};
