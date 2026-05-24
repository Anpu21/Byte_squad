import { useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { usePaymentSubmit } from '@/features/pos/hooks/usePaymentSubmit';
import { tryCalculateMultiTender } from '@/features/pos/lib/multi-tender';
import { PosPaymentMethod } from '@/features/pos/components/payment-method/PosPaymentMethod';
import { PosPaymentFormSwitch } from './PosPaymentFormSwitch';
import { PosTenderSummary } from './PosTenderSummary';
import { PosPaymentBanners } from './PosPaymentBanners';
import {
    createInitialTenderBag,
    resolveTenderInputs,
    type ITenderBag,
} from './pos-payment-forms.helpers';
import type { ICartItem } from '@/features/pos/types/cart-item.type';
import type {
    ISale,
    TPaymentMethod,
} from '@/types';

export interface IPosPaymentFormsProps {
    isOpen: boolean;
    onClose: () => void;
    invoiceTotal: number;
    /** Cart items in the active sale; flattened into payload at submit time. */
    cart: ICartItem[];
    /** 0-100 cart-level discount percentage; forwarded to the backend. */
    cartDiscountPercentage: number;
    /** Fires with the persisted Sale after a successful checkout. */
    onSaleCreated: (sale: ISale) => void;
}

/**
 * Charge modal that wires the cashier's tender bag and cart into one
 * `POST /pos/sales` call. Submission lives in `usePaymentSubmit`; this
 * orchestrator owns local UI state (method, bag, idempotency anchor) and
 * the multi-tender calc that drives the summary + Charge enablement. On
 * open we reset the bag + mint a fresh idempotency key via an adjust-
 * during-render anchor. Charge stays disabled when the calc is null
 * (overpay — no customer credit fallback in single-shop retail), the
 * tender is empty, or the cart is empty. On failure the modal stays open
 * and reuses the same key so the backend duplicate guard returns the
 * same Sale id on retry.
 */
export function PosPaymentForms({
    isOpen,
    onClose,
    invoiceTotal,
    cart,
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

    const tenderInputs = useMemo(
        () => resolveTenderInputs(paymentMethod, bag, invoiceTotal),
        [paymentMethod, bag, invoiceTotal],
    );
    const calc = useMemo(() => tryCalculateMultiTender(tenderInputs), [tenderInputs]);

    const submit = usePaymentSubmit({
        cart, cartDiscountPercentage,
        paymentMethod, bag, tenderInputs, idempotencyKey, onSaleCreated, onClose,
    });

    const hasError = calc === null;
    const isEmptyTender = calc !== null && calc.paymentAmount === 0;
    const disableCharge =
        submit.isPending || hasError || isEmptyTender || cart.length === 0;

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
                    bag={bag}
                    onPatchBag={(patch) =>
                        setBag((prev) => ({ ...prev, ...patch }))
                    }
                />

                <PosTenderSummary
                    invoiceTotal={invoiceTotal}
                    calc={calc}
                />

                <PosPaymentBanners
                    hasMultiTenderError={hasError}
                    mutationError={submit.error}
                />

                <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={submit.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={() => calc && submit.handleCharge(calc.paymentAmount)}
                        disabled={disableCharge}
                    >
                        {chargeButtonLabel(
                            submit.isPending,
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
