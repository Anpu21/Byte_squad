/**
 * Opaque parked-cart payload (cart items + cart-level discount + attached
 * loyalty owner). The server never interprets it for stock or pricing — a
 * resumed cart is re-priced and re-validated through the normal checkout
 * path, so this is display/restore data only.
 */
export type HeldSaleSnapshot = Record<string, unknown>;
