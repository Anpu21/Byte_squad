import { useCallback } from 'react';
import { usePosCart } from '@/features/pos/hooks/usePosCart';
import { usePosPageState } from '@/features/pos/hooks/usePosPageState';
import { usePosBarcodeScan } from '@/features/pos/hooks/usePosBarcodeScan';
import { usePrintReceipt } from '@/features/pos/hooks/usePrintReceipt';
import { usePosSaleById } from '@/features/pos/hooks/usePosSaleById';
import { PosItemTable } from '@/features/pos/components/item-table/PosItemTable';
import { PosInvoiceTotal } from '@/features/pos/components/invoice-total/PosInvoiceTotal';
import { PosActionButtons } from '@/features/pos/components/action-buttons/PosActionButtons';
import { PosRecentSaleSidebar } from '@/features/pos/components/recent-sale/PosRecentSaleSidebar';
import { PosPaymentForms } from '@/features/pos/components/payment-forms/PosPaymentForms';
import { PosBillPreviewModal } from '@/features/pos/components/bill-template/PosBillPreviewModal';
import { PosPrintHost } from '@/features/pos/components/bill-template/PosPrintHost';
import { applyCartDiscount } from '@/features/pos/components/invoice-total/pos-invoice-total.helpers';
import { toCartItemSeed } from '@/features/pos/lib/cart-item-seed';
import type { ISale, ISearchProductRow } from '@/types';

/**
 * Cashier POS workspace. Pure composition: state lives in
 * `usePosPageState`, print pipeline in `usePrintReceipt`, barcode bridge
 * pauses while any modal owns focus.
 */
export function PosPage(): React.ReactElement {
    const cart = usePosCart();
    const state = usePosPageState();
    const print = usePrintReceipt();
    const previewQuery = usePosSaleById(state.previewSaleId);
    const handleScanHit = useCallback(
        (row: ISearchProductRow) => cart.addItem(toCartItemSeed(row)),
        [cart],
    );
    const barcode = usePosBarcodeScan({
        onProductFound: handleScanHit,
        enabled:
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
    const invoiceTotal = applyCartDiscount(
        cart.itemsSubtotal, cart.totalDiscount, cart.totalTax,
        state.cartDiscountPercentage,
    ).cartTotal;
    const handleSaleCreated = useCallback((sale: ISale) => {
        state.setLastSale(sale);
        cart.clear();
        state.resetAfterCheckout();
        void print.printReceipt(sale);
        window.setTimeout(() => state.focusSearch(), 0);
    }, [cart, print, state]);
    const handlePrintLast = useCallback(() => {
        if (state.lastSale) void print.printReceipt(state.lastSale);
    }, [print, state.lastSale]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 min-h-[calc(100dvh-6.5rem)] pb-4">
            <PosItemTable
                cart={cart.cart}
                addItem={cart.addItem}
                updateItem={cart.updateItem}
                removeItem={cart.removeItem}
                searchInputRef={state.searchInputRef}
                onScanBarcode={handleCameraScan}
            />
            <div className="flex flex-col gap-3">
                <PosInvoiceTotal
                    itemsSubtotal={cart.itemsSubtotal}
                    totalLineDiscount={cart.totalDiscount}
                    totalTax={cart.totalTax}
                    cartDiscountPercentage={state.cartDiscountPercentage}
                    onCartDiscountChange={state.setCartDiscountPercentage}
                />
                <PosActionButtons
                    onFocusSearch={state.focusSearch}
                    onClearCart={cart.clear}
                    onPrintLastReceipt={handlePrintLast}
                    onShowRecent={state.openRecent}
                    onOpenPayment={state.openPayment}
                    isCartEmpty={cart.cart.length === 0}
                    hasLastReceipt={state.lastSale !== null}
                />
            </div>
            <PosPaymentForms
                isOpen={state.showPayment}
                onClose={state.closePayment}
                invoiceTotal={invoiceTotal}
                cart={cart.cart}
                cartDiscountPercentage={state.cartDiscountPercentage}
                onSaleCreated={handleSaleCreated}
            />
            <PosRecentSaleSidebar
                isOpen={state.showRecent}
                onClose={state.closeRecent}
                onSelectSale={state.setPreviewSaleId}
            />
            <PosBillPreviewModal
                isOpen={state.previewSaleId !== null}
                onClose={() => state.setPreviewSaleId(null)}
                sale={previewQuery.data ?? null}
            />
            <PosPrintHost sale={print.printingSale} />
        </div>
    );
}
