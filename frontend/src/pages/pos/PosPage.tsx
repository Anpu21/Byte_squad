import { useCallback, useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Layers, PauseCircle, Undo2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import {
    usePosCart,
    type SchemeDiscountResolver,
} from '@/features/pos/hooks/usePosCart';
import { usePosAddItemGuard } from '@/features/pos/hooks/usePosAddItemGuard';
import { useActiveSchemes } from '@/features/pos/hooks/useActiveSchemes';
import { resolveSchemeDiscount } from '@/features/pos/lib/scheme-discount';
import { usePosPageState } from '@/features/pos/hooks/usePosPageState';
import { usePosHeldBills } from '@/features/pos/hooks/usePosHeldBills';
import { PosHeldBillsModal } from '@/features/pos/components/held-bills/PosHeldBillsModal';
import { PosReturnModal } from '@/features/pos/components/returns/PosReturnModal';
import { PosShiftControls } from '@/features/pos/components/shift/PosShiftControls';
import { usePosBarcodeScan } from '@/features/pos/hooks/usePosBarcodeScan';
import { usePrintReceipt } from '@/features/pos/hooks/usePrintReceipt';
import { usePosSaleById } from '@/features/pos/hooks/usePosSaleById';
import { usePosInvoiceNumber } from '@/features/pos/hooks/usePosInvoiceNumber';
import { usePosLoyaltySettings } from '@/features/pos/hooks/usePosLoyaltySettings';
import { PosBillingGrid } from '@/features/pos/components/billing-grid';
import { PosInvoiceTotal } from '@/features/pos/components/invoice-total/PosInvoiceTotal';
import { PosBillLivePreview } from '@/features/pos/components/bill-live-preview/PosBillLivePreview';
import { PosActionButtons } from '@/features/pos/components/action-buttons/PosActionButtons';
import { PosLoyaltyCard } from '@/features/pos/components/loyalty-card/PosLoyaltyCard';
import { PosRecentSaleSidebar } from '@/features/pos/components/recent-sale/PosRecentSaleSidebar';
import { PosBillPreviewModal } from '@/features/pos/components/bill-template/PosBillPreviewModal';
import { PosPrintHost } from '@/features/pos/components/bill-template/PosPrintHost';
import { PosModeSwitch, type PosMode } from '@/features/pos/components/mode-switch/PosModeSwitch';
import { ScanOrderView } from '@/features/scan-order/components/ScanOrderView';
import { usePaymentSubmit } from '@/features/pos/hooks/usePaymentSubmit';
import { tryCalculateMultiTender } from '@/features/pos/lib/multi-tender';
import { createInitialTenderBag, resolveTenderInputs } from '@/features/pos/components/payment-forms/pos-payment-forms.helpers';
import { PosCashTenderForm } from '@/features/pos/components/payment-forms/PosCashTenderForm';
import { PosPaymentBanners } from '@/features/pos/components/payment-forms/PosPaymentBanners';
import { applyCartDiscount } from '@/features/pos/components/invoice-total/pos-invoice-total.helpers';
import { sizeLoyaltyRedeem } from '@/features/pos/lib/loyalty-redeem-value';
import { toCartItemSeed } from '@/features/pos/lib/cart-item-seed';
import type { ISale, ISearchProductRow } from '@/types';

/**
 * Cashier POS workspace. Pure composition: state lives in
 * `usePosPageState`, print pipeline in `usePrintReceipt`, barcode bridge
 * pauses while any modal owns focus. A mode switch swaps the content
 * between the billing grid and the scan-and-pick view — page hooks stay
 * mounted, so an in-progress cart survives the toggle.
 */
export function PosPage(): React.ReactElement {
    const [mode, setMode] = useState<PosMode>('billing');
    const schemesQuery = useActiveSchemes(mode === 'billing');
    const schemeResolver = useMemo<SchemeDiscountResolver | undefined>(() => {
        const schemes = schemesQuery.data;
        if (!schemes || schemes.length === 0) return undefined;
        return (input) => resolveSchemeDiscount(schemes, input);
    }, [schemesQuery.data]);
    const cart = usePosCart(schemeResolver);
    // Gate every add behind a branch-stock check so an out-of-stock product is
    // rejected with a toast at pick/scan time instead of failing at checkout.
    const guardedAddItem = usePosAddItemGuard(cart.addItem);
    const state = usePosPageState();
    const heldBills = usePosHeldBills();
    const [showHeldBills, setShowHeldBills] = useState(false);
    const [showReturn, setShowReturn] = useState(false);
    const print = usePrintReceipt();
    const previewQuery = usePosSaleById(state.previewSaleId);
    const invoiceNumberQuery = usePosInvoiceNumber();
    const loyaltySettingsQuery = usePosLoyaltySettings();
    const previewInvoiceNumber = invoiceNumberQuery.data?.invoiceNo ?? '';
    const handleScanHit = useCallback(
        (row: ISearchProductRow) => guardedAddItem(toCartItemSeed(row)),
        [guardedAddItem],
    );
    const barcode = usePosBarcodeScan({
        onProductFound: handleScanHit,
        enabled:
            mode === 'billing' && !showReturn &&
            !state.showPayment && !state.showRecent && state.previewSaleId === null,
    });
    const handleCameraScan = useCallback(
        (code: string) => { void barcode.triggerScan(code); },
        [barcode],
    );
    const invoiceTotal = applyCartDiscount(
        cart.itemsSubtotal, cart.totalDiscount, cart.totalTax,
        state.cartDiscountPercentage,
    ).cartTotal;

    // Redeemed loyalty points settle part of the bill (Model B): the cashier
    // collects `invoiceTotal - redeemValue` in money while the Sale total
    // stays gross. Sized via the shared helper so the cap + money value match
    // the backend's `previewRedeemValue`; the backend re-caps authoritatively.
    const loyaltyRedeem = useMemo(
        () =>
            sizeLoyaltyRedeem({
                owner: state.loyaltyOwner,
                requestedPoints: state.loyaltyRedeemPoints,
                itemsSubtotal: cart.itemsSubtotal,
                settings: loyaltySettingsQuery.data ?? null,
            }),
        [
            state.loyaltyOwner,
            state.loyaltyRedeemPoints,
            cart.itemsSubtotal,
            loyaltySettingsQuery.data,
        ],
    );
    const payableByMoney = Math.max(
        0,
        Math.round((invoiceTotal - loyaltyRedeem.redeemValue) * 100) / 100,
    );

    const [cashTendered, setCashTendered] = useState(payableByMoney);
    useEffect(() => {
        setCashTendered(payableByMoney);
    }, [payableByMoney]);

    const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

    const tenderInputs = useMemo(
        () => resolveTenderInputs('Cash', { ...createInitialTenderBag(payableByMoney), cashTendered }, payableByMoney),
        [cashTendered, payableByMoney]
    );
    const calc = useMemo(() => tryCalculateMultiTender(tenderInputs), [tenderInputs]);

    const handleSaleCreated = useCallback((sale: ISale) => {
        state.setLastSale(sale);
        cart.clear();
        state.resetAfterCheckout();
        void print.printReceipt(sale);
        window.setTimeout(() => state.focusSearch(), 0);
    }, [cart, print, state]);

    const submit = usePaymentSubmit({
        cart: cart.cart,
        cartDiscountPercentage: state.cartDiscountPercentage,
        paymentMethod: 'Cash',
        bag: { ...createInitialTenderBag(payableByMoney), cashTendered },
        tenderInputs,
        idempotencyKey,
        loyaltyOwner: state.loyaltyOwner,
        loyaltyRedeemPoints: loyaltyRedeem.cappedPoints,
        onSaleCreated: (sale) => {
            setIdempotencyKey(crypto.randomUUID());
            handleSaleCreated(sale);
        },
        onClose: () => {},
    });

    const hasError = calc === null;
    // A fully points-covered bill has zero money tender but is still
    // chargeable, so only block on an empty tender when no points settle it.
    const isEmptyTender =
        calc !== null &&
        calc.paymentAmount === 0 &&
        loyaltyRedeem.redeemValue === 0;
    const disableCharge = submit.isPending || hasError || isEmptyTender || cart.cart.length === 0;
    const handlePrintLast = useCallback(() => {
        if (state.lastSale) void print.printReceipt(state.lastSale);
    }, [print, state.lastSale]);

    const billLabel = useCallback(
        () =>
            state.loyaltyOwner?.firstName ??
            cart.cart[0]?.productName ??
            'Held bill',
        [cart.cart, state.loyaltyOwner],
    );

    const holdCurrentBill = useCallback(() => {
        if (cart.cart.length === 0) return;
        heldBills.holdBill({
            label: billLabel(),
            items: cart.cart,
            cartDiscountPercentage: state.cartDiscountPercentage,
            loyaltyOwner: state.loyaltyOwner,
            loyaltyRedeemPoints: state.loyaltyRedeemPoints,
        });
        cart.clear();
        state.resetAfterCheckout();
        toast.success('Bill held — resume it from the shelf anytime');
        state.focusSearch();
    }, [billLabel, cart, heldBills, state]);

    const resumeHeldBill = useCallback(
        (id: string) => {
            const bill = heldBills.takeBill(id);
            if (!bill) return;
            // Swap: a non-empty cart is parked first so nothing is lost.
            if (cart.cart.length > 0) {
                heldBills.holdBill({
                    label: billLabel(),
                    items: cart.cart,
                    cartDiscountPercentage: state.cartDiscountPercentage,
                    loyaltyOwner: state.loyaltyOwner,
                    loyaltyRedeemPoints: state.loyaltyRedeemPoints,
                });
            }
            cart.restore(bill.items);
            state.setCartDiscountPercentage(bill.cartDiscountPercentage);
            state.setLoyaltyOwner(bill.loyaltyOwner);
            state.setLoyaltyRedeemPoints(bill.loyaltyRedeemPoints);
            setShowHeldBills(false);
            toast.success(`Resumed: ${bill.label}`);
        },
        [billLabel, cart, heldBills, state],
    );

    return (
        <div className="flex flex-col gap-3 min-h-[calc(100dvh-6.5rem)] pb-4">
            <div className="flex items-center justify-between gap-2">
                <PosModeSwitch mode={mode} onChange={setMode} />
                {mode === 'billing' && (
                    <div className="flex items-center gap-1.5">
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={holdCurrentBill}
                            disabled={cart.cart.length === 0}
                        >
                            <PauseCircle size={14} aria-hidden />
                            Hold bill
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setShowHeldBills(true)}
                        >
                            <Layers size={14} aria-hidden />
                            Held ({heldBills.heldBills.length})
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setShowReturn(true)}
                        >
                            <Undo2 size={14} aria-hidden />
                            Return
                        </Button>
                        <PosShiftControls />
                    </div>
                )}
            </div>
            {mode === 'scan' ? (
                <ScanOrderView onDone={() => setMode('billing')} />
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[4fr_1fr] gap-4 flex-1">
                <div className="flex flex-col gap-3">
                    <PosBillingGrid
                        cart={cart.cart}
                        addItem={guardedAddItem}
                        updateItem={cart.updateItem}
                        removeItem={cart.removeItem}
                        onClear={cart.clear}
                        searchInputRef={state.searchInputRef}
                        onScanBarcode={handleCameraScan}
                        footerSlot={
                            <PosInvoiceTotal
                                itemsSubtotal={cart.itemsSubtotal}
                                totalLineDiscount={cart.totalDiscount}
                                totalTax={cart.totalTax}
                                cartDiscountPercentage={state.cartDiscountPercentage}
                                onCartDiscountChange={state.setCartDiscountPercentage}
                            />
                        }
                    />
                </div>
                <div className="flex flex-col gap-3">
                    <PosLoyaltyCard
                        loyaltyOwner={state.loyaltyOwner} onAttach={state.setLoyaltyOwner}
                        onDetach={() => state.setLoyaltyOwner(null)}
                        redeemPoints={state.loyaltyRedeemPoints}
                        onRedeemChange={state.setLoyaltyRedeemPoints}
                        maxRedeemable={loyaltyRedeem.maxRedeemable}
                    />
                    <PosBillLivePreview
                        cart={cart.cart} invoiceNumber={previewInvoiceNumber}
                        cartDiscountPercentage={state.cartDiscountPercentage}
                        loyaltyOwner={state.loyaltyOwner}
                        loyaltyRedeemPoints={state.loyaltyRedeemPoints}
                        loyaltySettings={loyaltySettingsQuery.data ?? null}
                    />
                    {cart.cart.length > 0 && (
                        <>
                            <PosCashTenderForm
                                invoiceTotal={payableByMoney}
                                cashTendered={cashTendered}
                                onCashTenderedChange={setCashTendered}
                                loyaltyRedeemValue={loyaltyRedeem.redeemValue}
                            />
                            <PosPaymentBanners
                                hasMultiTenderError={hasError}
                                mutationError={submit.error}
                            />
                        </>
                    )}
                    <PosActionButtons
                        onFocusSearch={state.focusSearch} onClearCart={cart.clear}
                        onPrintLastReceipt={handlePrintLast} onShowRecent={state.openRecent}
                        onCharge={() => calc && submit.handleCharge(calc.paymentAmount)}
                        disableCharge={disableCharge}
                        isCartEmpty={cart.cart.length === 0}
                        hasLastReceipt={state.lastSale !== null}
                    />
                </div>
            </div>
            )}
            <PosRecentSaleSidebar
                isOpen={state.showRecent} onClose={state.closeRecent}
                onSelectSale={state.setPreviewSaleId}
            />
            <PosBillPreviewModal
                isOpen={state.previewSaleId !== null} sale={previewQuery.data ?? null}
                onClose={() => state.setPreviewSaleId(null)}
            />
            <PosHeldBillsModal
                isOpen={showHeldBills}
                onClose={() => setShowHeldBills(false)}
                heldBills={heldBills.heldBills}
                onResume={resumeHeldBill}
                onDiscard={heldBills.discardBill}
            />
            <PosReturnModal
                isOpen={showReturn}
                onClose={() => setShowReturn(false)}
            />
            <PosPrintHost sale={print.printingSale} />
        </div>
    );
}
