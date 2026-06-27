import type { ICartItem } from './cart-item.type';
import type { IPosLoyaltyOwner } from '../hooks/useLoyaltyAttach';

/**
 * The restorable contents of a parked sale — everything needed to rebuild
 * the cart when resumed. Persisted server-side as an opaque snapshot, so a
 * bill parked on one terminal can be recalled on any other in the branch.
 */
export interface IHeldSaleSnapshot {
    items: ICartItem[];
    cartDiscountPercentage: number;
    loyaltyOwner: IPosLoyaltyOwner | null;
    loyaltyRedeemPoints: number;
}

/**
 * A parked in-flight sale, projected for the cashier shelf. Nothing is
 * posted to the ledger or stock until the resumed bill goes through
 * checkout — the server stores only the snapshot.
 */
export interface IHeldBill extends IHeldSaleSnapshot {
    id: string;
    /** ISO timestamp of when the bill was parked. */
    heldAt: string;
    /** Display hint — customer name or first item. */
    label: string;
    /** Cashier who parked it — shown so supervisors can recall any bill. */
    heldByName?: string | null;
}
