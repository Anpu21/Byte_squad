import type { IMultiTenderInputs } from '@/features/pos/lib/multi-tender';
import type { ICartItem } from '@/features/pos/types/cart-item.type';
import type { IPosLoyaltyOwner } from '@/features/pos/hooks/useLoyaltyAttach';
import type {
    ICreateSalePayload,
    ICreateSaleItemPayload,
    ICreateSalePaymentPayload,
    TPaymentMethod,
} from '@/types';

/**
 * Local state slot for the cashier's in-progress multi-tender bag.
 * Lives only inside `PosPaymentForms` — the values are flattened into
 * `ICreateSalePaymentPayload` at submit time. `creditAmount` is the
 * buy-on-credit (khata) portion; it's only non-zero when a credit account
 * is attached and the cashier picks the Credit method.
 */
export interface ITenderBag {
    cashTendered: number;
    creditAmount: number;
}

/**
 * Resolve the multi-tender calc inputs for the active method. Each method
 * draws on its own subset of bag fields so a stale value from a previous
 * method doesn't leak into the totals.
 *
 * Card behaves as a full-invoice external payment: we record it via
 * `cashAmount = invoiceTotal` so the calc treats the sale as Paid without
 * the cashier needing to type anything (card settles through PayHere).
 */
export function resolveTenderInputs(
    method: TPaymentMethod,
    bag: ITenderBag,
    invoiceTotal: number,
): IMultiTenderInputs {
    const baseline: IMultiTenderInputs = {
        invoiceTotal,
        cashAmount: 0,
        cashTendered: 0,
        chequeAmount: 0,
        bankTransferAmount: 0,
        creditAmount: 0,
        keepBalance: false,
    };
    if (method === 'Cash') {
        return {
            ...baseline,
            cashAmount: Math.min(bag.cashTendered, invoiceTotal),
            cashTendered: bag.cashTendered,
        };
    }
    if (method === 'Credit') {
        // Buy-on-credit: the whole invoice rides the customer's khata. The
        // backend posts a Credit_Taken row and advances the account balance.
        return { ...baseline, creditAmount: bag.creditAmount };
    }
    // Card: full-invoice external tender settled via PayHere.
    return {
        ...baseline,
        cashAmount: invoiceTotal,
        cashTendered: invoiceTotal,
    };
}

/**
 * Seed the bag with `cashTendered = invoiceTotal` so the common
 * "exact-cash" case requires zero keystrokes.
 */
export function createInitialTenderBag(invoiceTotal: number): ITenderBag {
    return {
        cashTendered: invoiceTotal,
        creditAmount: 0,
    };
}

interface IBuildPayloadArgs {
    cart: ICartItem[];
    cartDiscountPercentage: number;
    paymentMethod: TPaymentMethod;
    paymentAmount: number;
    bag: ITenderBag;
    /** Cash portion applied to the invoice (capped at invoiceTotal). */
    cashAmount: number;
    /** Loyalty owner attached via the cashier card, if any. */
    loyaltyOwner?: IPosLoyaltyOwner | null;
    /** Whole-point redeem amount; ignored when 0 or no owner is attached. */
    loyaltyRedeemPoints?: number;
    /** Khata account funding a buy-on-credit sale (paymentMethod === 'Credit'). */
    creditAccountId?: string | null;
    /** Short-lived manager override token for an over-limit credit charge. */
    creditOverrideToken?: string | null;
}

/**
 * Map cart rows and the tender bag onto the create-sale payload the
 * backend expects. Card / Credit tenders ride the `paymentMethod` field
 * alone — no per-method amount; the backend treats them as Cash-equivalent
 * with `cashAmount = invoice total` so `paidAmount` lands correctly.
 *
 * Loyalty intent is layered on top of the tender bag: when the cashier
 * attached an owner via the loyalty card we send either `customerUserId`
 * (registered) or `loyaltyCustomerId` (walk-in) — never both — plus the
 * optional `loyaltyRedeemPoints` when > 0. The backend enforces the
 * exclusivity and the redeem cap.
 */
export function buildSalePayload({
    cart,
    cartDiscountPercentage,
    paymentMethod,
    paymentAmount,
    bag,
    cashAmount,
    loyaltyOwner,
    loyaltyRedeemPoints,
    creditAccountId,
    creditOverrideToken,
}: IBuildPayloadArgs): ICreateSalePayload {
    const items: ICreateSaleItemPayload[] = cart.map((row) => ({
        productId: row.productId,
        unitId: row.unitId ?? undefined,
        quantity: row.quantity,
        free: row.free,
        unitPrice: row.unitPrice,
        discountPercentage: row.discountPercentage,
        taxRate: row.taxRate,
    }));

    const payment: ICreateSalePaymentPayload = {
        paymentMethod,
        paymentAmount,
        ...buildPaymentTender(paymentMethod, bag, cashAmount),
    };

    // Buy-on-credit owns the customer identity for the sale: the khata account
    // is the payer, so we send `creditAccountId` (+ optional override token) and
    // omit the loyalty owner — the BE rejects creditAccountId + customerUserId.
    if (paymentMethod === 'Credit' && creditAccountId) {
        return {
            cartDiscountPercentage,
            items,
            payment,
            creditAccountId,
            ...(creditOverrideToken ? { creditOverrideToken } : {}),
        };
    }

    return {
        cartDiscountPercentage,
        items,
        payment,
        ...buildLoyaltyFields(loyaltyOwner, loyaltyRedeemPoints),
    };
}

/**
 * Pick the right loyalty owner field for the payload. The BE rejects
 * the combination `customerUserId && loyaltyCustomerId` with a 400 so
 * we always emit at most one. Returns an empty object when no owner
 * is attached so the spread is a no-op.
 */
function buildLoyaltyFields(
    owner: IPosLoyaltyOwner | null | undefined,
    redeemPoints: number | undefined,
): Pick<ICreateSalePayload, 'customerUserId' | 'loyaltyCustomerId' | 'loyaltyRedeemPoints'> {
    if (!owner) return {};
    const fields: Pick<ICreateSalePayload, 'customerUserId' | 'loyaltyCustomerId' | 'loyaltyRedeemPoints'> = {};
    if (owner.ownerType === 'user' && owner.userId) {
        fields.customerUserId = owner.userId;
    } else if (owner.ownerType === 'walkIn' && owner.loyaltyCustomerId) {
        fields.loyaltyCustomerId = owner.loyaltyCustomerId;
    }
    if (redeemPoints !== undefined && redeemPoints > 0) {
        fields.loyaltyRedeemPoints = redeemPoints;
    }
    return fields;
}

function buildPaymentTender(
    method: TPaymentMethod,
    bag: ITenderBag,
    cashAmount: number,
): Partial<ICreateSalePaymentPayload> {
    if (method === 'Credit') {
        // Buy-on-credit: send the credit amount so the backend records the
        // Credit_Taken ledger row and advances the khata balance.
        return bag.creditAmount > 0 ? { creditAmount: bag.creditAmount } : {};
    }
    if (method === 'Card') {
        // External tender (PayHere): send no cash fields. The backend stores
        // the method label and treats `paymentAmount` as the settled total.
        return {};
    }
    // Cash tender.
    const tender: Partial<ICreateSalePaymentPayload> = {};
    if (cashAmount > 0) tender.cashAmount = cashAmount;
    if (bag.cashTendered > 0) tender.cashTendered = bag.cashTendered;
    return tender;
}
