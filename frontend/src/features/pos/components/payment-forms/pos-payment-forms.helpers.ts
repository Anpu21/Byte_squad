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
 * `ICreateSalePaymentPayload` at submit time. The Credit tender and the
 * keep-balance toggle were removed with the customer-picker, so neither
 * field appears here.
 */
export interface ITenderBag {
    cashTendered: number;
    chequeAmount: number;
    chequeNo: string;
    chequeDate: string;
    chequeBank: string;
    chequeBranch: string;
    chequeRef: string;
    chequeDeliveredBy: string;
    bankTransferAmount: number;
    bankRef: string;
}

/**
 * Resolve the multi-tender calc inputs for the active method. Each method
 * draws on its own subset of bag fields so a stale value from a previous
 * method doesn't leak into the totals.
 *
 * Card / Mobile behave as full-invoice external payments: we record them
 * via `cashAmount = invoiceTotal` so the calc treats the sale as Paid
 * without the cashier needing to type anything.
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
    if (method === 'Card' || method === 'Mobile' || method === 'Credit') {
        return {
            ...baseline,
            cashAmount: invoiceTotal,
            cashTendered: invoiceTotal,
        };
    }
    if (method === 'Cheque') {
        return { ...baseline, chequeAmount: bag.chequeAmount };
    }
    return { ...baseline, bankTransferAmount: bag.bankTransferAmount };
}

/**
 * Seed the bag with `cashTendered = invoiceTotal` so the common
 * "exact-cash" case requires zero keystrokes. Other tenders default to 0
 * and the cashier opts in by switching methods.
 */
export function createInitialTenderBag(invoiceTotal: number): ITenderBag {
    return {
        cashTendered: invoiceTotal,
        chequeAmount: 0,
        chequeNo: '',
        chequeDate: '',
        chequeBank: '',
        chequeBranch: '',
        chequeRef: '',
        chequeDeliveredBy: '',
        bankTransferAmount: 0,
        bankRef: '',
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
}

/**
 * Map cart rows and the tender bag onto the create-sale payload the
 * backend expects. Card / Mobile / Credit tenders ride the
 * `paymentMethod` field alone — no per-method amount; the backend treats
 * them as Cash-equivalent with `cashAmount = invoice total` so
 * `paidAmount` lands correctly.
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
    if (method === 'Card' || method === 'Mobile' || method === 'Credit') {
        // External tender: send no cash/cheque/bank fields. The backend
        // stores the method label and treats `paymentAmount` as the
        // settled total. The cashier verifies receipt externally.
        return {};
    }
    const tender: Partial<ICreateSalePaymentPayload> = {};
    if (method === 'Cash') {
        if (cashAmount > 0) tender.cashAmount = cashAmount;
        if (bag.cashTendered > 0) tender.cashTendered = bag.cashTendered;
    } else if (method === 'Cheque') {
        if (bag.chequeAmount > 0) tender.chequeAmount = bag.chequeAmount;
        if (bag.chequeNo) tender.chequeNo = bag.chequeNo;
        if (bag.chequeDate) tender.chequeDate = bag.chequeDate;
        if (bag.chequeBank) tender.chequeBank = bag.chequeBank;
        if (bag.chequeBranch) tender.chequeBranch = bag.chequeBranch;
        if (bag.chequeRef) tender.chequeRef = bag.chequeRef;
        if (bag.chequeDeliveredBy)
            tender.chequeDeliveredBy = bag.chequeDeliveredBy;
    } else if (method === 'Bank') {
        if (bag.bankTransferAmount > 0)
            tender.bankTransferAmount = bag.bankTransferAmount;
        if (bag.bankRef) tender.bankRef = bag.bankRef;
    }
    return tender;
}
