import type { ICartItem } from './cart-item.type';
import type { IPosLoyaltyOwner } from '../hooks/useLoyaltyAttach';

/**
 * A parked in-flight sale. Pure client state (localStorage) — nothing is
 * posted to the server until the resumed bill goes through checkout.
 */
export interface IHeldBill {
    id: string;
    /** ISO timestamp of when the bill was parked. */
    heldAt: string;
    /** Display hint — customer name or first item. */
    label: string;
    items: ICartItem[];
    cartDiscountPercentage: number;
    loyaltyOwner: IPosLoyaltyOwner | null;
    loyaltyRedeemPoints: number;
}
