import type { IMultiTenderInputs } from '@/features/pos/lib/multi-tender';
import type { ICartItem } from '@/features/pos/types/cart-item.type';
import type {
    ICreateSalePayload,
    ICreateSaleItemPayload,
    ICreateSalePaymentPayload,
    TPaymentMethod,
} from '@/types';

/**
 * Local state slot for the cashier's in-progress multi-tender bag.
 * Lives only inside `PosPaymentForms` — the values are flattened into
 * `ICreateSalePaymentPayload` at submit time.
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
    creditAmount: number;
    keepBalance: boolean;
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
        keepBalance: bag.keepBalance,
    };
    if (method === 'Cash') {
        return {
            ...baseline,
            cashAmount: Math.min(bag.cashTendered, invoiceTotal),
            cashTendered: bag.cashTendered,
        };
    }
    if (method === 'Card' || method === 'Mobile') {
        return {
            ...baseline,
            cashAmount: invoiceTotal,
            cashTendered: invoiceTotal,
        };
    }
    if (method === 'Cheque') {
        return { ...baseline, chequeAmount: bag.chequeAmount };
    }
    if (method === 'Bank') {
        return { ...baseline, bankTransferAmount: bag.bankTransferAmount };
    }
    return { ...baseline, creditAmount: bag.creditAmount };
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
        creditAmount: 0,
        keepBalance: false,
    };
}

interface IBuildPayloadArgs {
    cart: ICartItem[];
    customerUserId: string | null;
    cartDiscountPercentage: number;
    paymentMethod: TPaymentMethod;
    paymentAmount: number;
    bag: ITenderBag;
    /** Cash portion applied to the invoice (capped at invoiceTotal). */
    cashAmount: number;
}

/**
 * Map cart rows and the tender bag onto the create-sale payload the
 * backend expects. Card/Mobile tenders ride the `paymentMethod` field
 * alone — no per-method amount; the backend treats them as Cash-equivalent
 * with `cashAmount = invoice total` so `paidAmount` lands correctly.
 *
 * The Retail/Wholesale tier toggle was removed, so we no longer send
 * `saleType` / `priceLevel`; the backend DTO defaults both to `'Retail'`.
 */
export function buildSalePayload({
    cart,
    customerUserId,
    cartDiscountPercentage,
    paymentMethod,
    paymentAmount,
    bag,
    cashAmount,
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
        customerUserId: customerUserId ?? undefined,
        cartDiscountPercentage,
        items,
        payment,
    };
}

function buildPaymentTender(
    method: TPaymentMethod,
    bag: ITenderBag,
    cashAmount: number,
): Partial<ICreateSalePaymentPayload> {
    if (method === 'Card' || method === 'Mobile') {
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
    } else if (method === 'Credit') {
        if (bag.creditAmount > 0) tender.creditAmount = bag.creditAmount;
    }
    if (bag.keepBalance) tender.keepBalance = bag.keepBalance;
    return tender;
}
