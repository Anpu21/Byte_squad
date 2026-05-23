import { useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { usePosCreateSale } from '@/features/pos/hooks/usePosCreateSale';
import { tryCalculateMultiTender } from '@/features/pos/lib/multi-tender';
import { PosPaymentMethod } from '@/features/pos/components/payment-method/PosPaymentMethod';
import { PosPaymentFormSwitch } from './PosPaymentFormSwitch';
import { PosKeepBalanceToggle } from './PosKeepBalanceToggle';
import { PosTenderSummary } from './PosTenderSummary';
import { PosPaymentBanners } from './PosPaymentBanners';
import {
    createInitialTenderBag,
    buildSalePayload,
    resolveTenderInputs,
    type ITenderBag,
} from './pos-payment-forms.helpers';
import type { ICartItem } from '@/features/pos/types/cart-item.type';
import type {
    ICreateSalePayload,
    ISale,
    TPaymentMethod,
    TPriceLevel,
    TSaleType,
} from '@/types';

export interface IPosPaymentFormsProps {
    isOpen: boolean;
    onClose: () => void;
    invoiceTotal: number;
    /** Cart items in the active sale; flattened into payload at submit time. */
    cart: ICartItem[];
    customerUserId: string | null;
    saleType: TSaleType;
    priceLevel: TPriceLevel;
    /** 0-100 cart-level discount percentage; forwarded to the backend. */
    cartDiscountPercentage: number;
    /** Fires with the persisted Sale after a successful checkout. */
    onSaleCreated: (sale: ISale) => void;
}

/**
 * Charge modal that wires the cashier's tender bag and cart into one
 * `POST /pos/sales` call. Wrapped in the shared `<Modal>` primitive.
 *
 * Lifecycle:
 *  - On each open we reset the bag and mint a fresh idempotency key via
 *    an adjust-during-render anchor (no setState-in-effect).
 *  - Charge stays disabled when the calc returns null (overpay without
 *    keep-balance), the tender is empty, or the cart is empty.
 *  - Success: `onSaleCreated(sale)` then close. Failure: keep the modal
 *    open with a danger banner; the same key is reused so a backend
 *    duplicate guard returns the same Sale id on retry.
 */
export function PosPaymentForms({
    isOpen,
    onClose,
    invoiceTotal,
    cart,
    customerUserId,
    saleType,
    priceLevel,
    cartDiscountPercentage,
    onSaleCreated,
}: IPosPaymentFormsProps) {
    const [paymentMethod, setPaymentMethod] = useState<TPaymentMethod>('Cash');
    const [bag, setBag] = useState<ITenderBag>(() => createInitialTenderBag(invoiceTotal));
    const [idempotencyKey, setIdempotencyKey] = useState<string>(() => crypto.randomUUID());
    const [openAnchor, setOpenAnchor] = useState<boolean>(isOpen);
    if (isOpen !== openAnchor) {
        setOpenAnchor(isOpen);
        if (isOpen) {
            setBag(createInitialTenderBag(invoiceTotal));
            setIdempotencyKey(crypto.randomUUID());
            setPaymentMethod('Cash');
        }
    }

    const createSale = usePosCreateSale();
    const tenderInputs = useMemo(
        () => resolveTenderInputs(paymentMethod, bag, invoiceTotal),
        [paymentMethod, bag, invoiceTotal],
    );
    const calc = useMemo(() => tryCalculateMultiTender(tenderInputs), [tenderInputs]);

    const hasError = calc === null;
    const canKeepBalance = calc !== null && calc.paymentAmount > invoiceTotal;
    const isEmptyTender = calc !== null && calc.paymentAmount === 0;
    const disableCharge =
        createSale.isPending || hasError || isEmptyTender || cart.length === 0;

    const handleCharge = async () => {
        if (!calc) return;
        const payload: ICreateSalePayload = buildSalePayload({
            cart,
            customerUserId,
            saleType,
            priceLevel,
            cartDiscountPercentage,
            paymentMethod,
            paymentAmount: calc.paymentAmount,
            bag,
            cashAmount: tenderInputs.cashAmount,
        });
        try {
            const sale = await createSale.mutateAsync({ payload, idempotencyKey });
            onSaleCreated(sale);
            onClose();
        } catch {
            // Stay open; banner renders below from `createSale.error`.
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Charge sale"
            maxWidth="2xl"
            closeOnBackdrop={false}
        >
            <div className="flex flex-col gap-4">
                <PosPaymentMethod
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                />

                <PosPaymentFormSwitch
                    paymentMethod={paymentMethod}
                    invoiceTotal={invoiceTotal}
                    customerUserId={customerUserId}
                    bag={bag}
                    onPatchBag={(patch) =>
                        setBag((prev) => ({ ...prev, ...patch }))
                    }
                />

                <PosKeepBalanceToggle
                    enabled={canKeepBalance}
                    value={bag.keepBalance}
                    onChange={(next) =>
                        setBag((prev) => ({ ...prev, keepBalance: next }))
                    }
                />

                <PosTenderSummary
                    invoiceTotal={invoiceTotal}
                    calc={calc}
                />

                <PosPaymentBanners
                    hasMultiTenderError={hasError}
                    mutationError={createSale.error as Error | null}
                />

                <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={createSale.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleCharge}
                        disabled={disableCharge}
                    >
                        {chargeButtonLabel(
                            createSale.isPending,
                            calc?.paidAmount ?? 0,
                            calc?.balanceDue ?? 0,
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

function chargeButtonLabel(
    isPending: boolean,
    paidAmount: number,
    balanceDue: number,
): string {
    if (isPending) return 'Recording…';
    if (balanceDue > 0) {
        return `Charge ${formatCurrency(paidAmount)} — outstanding ${formatCurrency(balanceDue)}`;
    }
    return `Charge ${formatCurrency(paidAmount)}`;
}
