import { useCallback, useMemo, useState } from 'react';
import {
    usePosCart,
    type SchemeDiscountResolver,
} from '@/features/pos/hooks/usePosCart';
import { usePosAddItemGuard } from '@/features/pos/hooks/usePosAddItemGuard';
import { useActiveSchemes } from '@/features/pos/hooks/useActiveSchemes';
import { resolveSchemeDiscount } from '@/features/pos/lib/scheme-discount';
import { usePosPageState } from '@/features/pos/hooks/usePosPageState';
import { usePosHeldBills } from '@/features/pos/hooks/usePosHeldBills';
import { usePosBarcodeScan } from '@/features/pos/hooks/usePosBarcodeScan';
import { usePrintReceipt } from '@/features/pos/hooks/usePrintReceipt';
import { usePosSaleById } from '@/features/pos/hooks/usePosSaleById';
import { usePosInvoiceNumber } from '@/features/pos/hooks/usePosInvoiceNumber';
import { usePosLoyaltySettings } from '@/features/pos/hooks/usePosLoyaltySettings';
import { usePosCheckout } from '@/features/pos/hooks/usePosCheckout';
import { usePosHeldBillActions } from '@/features/pos/hooks/usePosHeldBillActions';
import { PosBillingGrid } from '@/features/pos/components/billing-grid';
import { PosInvoiceTotal } from '@/features/pos/components/invoice-total/PosInvoiceTotal';
import { ScanOrderView } from '@/features/scan-order/components/ScanOrderView';
import { PosHeaderBar } from '@/features/pos/components/header-bar/PosHeaderBar';
import { PosCheckoutSidebar } from '@/features/pos/components/checkout-sidebar/PosCheckoutSidebar';
import { PosCheckoutModals } from '@/features/pos/components/checkout-modals/PosCheckoutModals';
import { type PosMode } from '@/features/pos/components/mode-switch/PosModeSwitch';
import { toCartItemSeed } from '@/features/pos/lib/cart-item-seed';
import type { ISearchProductRow } from '@/types';

/**
 * Cashier POS workspace. Pure composition: state lives in
 * `usePosPageState`, checkout/tender in `usePosCheckout`, print pipeline in
 * `usePrintReceipt`, barcode bridge pauses while any modal owns focus. A mode
 * switch swaps the content between the billing grid and the scan-and-pick
 * view — page hooks stay mounted, so an in-progress cart survives the toggle.
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
        (row: ISearchProductRow, quantity?: number) =>
            guardedAddItem(toCartItemSeed(row, { quantity })),
        [guardedAddItem],
    );
    const barcode = usePosBarcodeScan({
        onProductFound: handleScanHit,
        enabled:
            mode === 'billing' &&
            !showReturn &&
            !state.showPayment &&
            !state.showRecent &&
            state.previewSaleId === null,
    });
    const handleCameraScan = useCallback(
        (code: string) => {
            void barcode.triggerScan(code);
        },
        [barcode],
    );

    const checkout = usePosCheckout({
        cart,
        state,
        print,
        loyaltySettings: loyaltySettingsQuery.data,
    });
    const held = usePosHeldBillActions({
        cart,
        state,
        heldBills,
        setShowHeldBills,
    });

    return (
        <div className="flex flex-col gap-3 min-h-[calc(100dvh-6.5rem)] pb-4">
            <PosHeaderBar
                mode={mode}
                onModeChange={setMode}
                cartEmpty={cart.cart.length === 0}
                heldCount={heldBills.heldBills.length}
                onHoldBill={held.holdCurrentBill}
                onShowHeld={() => setShowHeldBills(true)}
                onShowReturn={() => setShowReturn(true)}
            />
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
                                    cartDiscountPercentage={
                                        state.cartDiscountPercentage
                                    }
                                    onCartDiscountChange={
                                        state.setCartDiscountPercentage
                                    }
                                />
                            }
                        />
                    </div>
                    <PosCheckoutSidebar
                        cart={cart}
                        state={state}
                        checkout={checkout}
                        loyaltySettings={loyaltySettingsQuery.data}
                        previewInvoiceNumber={previewInvoiceNumber}
                    />
                </div>
            )}
            <PosCheckoutModals
                state={state}
                checkout={checkout}
                heldBills={heldBills}
                previewSale={previewQuery.data ?? null}
                printingSale={print.printingSale}
                showHeldBills={showHeldBills}
                onCloseHeldBills={() => setShowHeldBills(false)}
                onResumeHeldBill={held.resumeHeldBill}
                showReturn={showReturn}
                onCloseReturn={() => setShowReturn(false)}
            />
        </div>
    );
}
