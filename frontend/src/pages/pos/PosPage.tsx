import { useCallback, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { IProduct } from '@/types';
import { usePosCart } from '@/features/pos/hooks/usePosCart';
import { usePosSearch } from '@/features/pos/hooks/usePosSearch';
import { usePosNumpad } from '@/features/pos/hooks/usePosNumpad';
import { usePosCheckout } from '@/features/pos/hooks/usePosCheckout';
import { usePosBarcodeScan } from '@/features/pos/hooks/usePosBarcodeScan';
import { usePosKeyboardShortcuts } from '@/features/pos/hooks/usePosKeyboardShortcuts';
import { PosSearchBar } from '@/features/pos/components/PosSearchBar';
import { PosStatusBar } from '@/features/pos/components/PosStatusBar';
import { PosProductGrid } from '@/features/pos/components/PosProductGrid';
import { PosCartPanel } from '@/features/pos/components/PosCartPanel';
import { PosPaymentModal } from '@/features/pos/components/PosPaymentModal';
import { PosCameraScannerModal } from '@/features/pos/components/PosCameraScannerModal';

export function PosPage() {
    const { user } = useAuth();
    const cart = usePosCart();
    const search = usePosSearch(user?.branchId);
    const numpad = usePosNumpad({
        onConfirmDiscount: cart.setDiscountAmount,
        onConfirmCustomItem: cart.addCustomItem,
    });
    const [showCameraScanner, setShowCameraScanner] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleAddProduct = useCallback(
        (product: IProduct) => {
            cart.addToCart(product, numpad.consumePendingQty());
            search.clearSearch();
        },
        [cart, numpad, search],
    );

    const scan = usePosBarcodeScan({
        onProductFound: handleAddProduct,
        enabled: !showCameraScanner,
    });

    const checkout = usePosCheckout({
        cart: cart.cart,
        discountValue: cart.discountValue,
        total: cart.total,
        onSuccess: () => {
            cart.setCart([]);
            cart.setDiscountAmount(0);
            requestAnimationFrame(() => searchInputRef.current?.focus());
        },
    });

    usePosKeyboardShortcuts({
        onFocusSearch: () => searchInputRef.current?.focus(),
        onOpenCheckout: checkout.openPaymentModal,
        onEscape: () => {
            if (checkout.showPaymentModal) checkout.closePaymentModal();
            else if (numpad.padMode !== 'idle') numpad.resetPad();
            else search.clearSearch();
        },
        canCheckout: cart.cart.length > 0,
    });

    const handleClearCart = useCallback(async () => {
        const cleared = await cart.clearCart();
        if (cleared) {
            checkout.dismissError();
            numpad.resetPad();
            numpad.cancelPendingQty();
        }
    }, [cart, checkout, numpad]);

    return (
        <div className="h-[calc(100dvh-6.5rem)] lg:h-[calc(100dvh-7.5rem)] flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex-1 flex flex-col gap-4 min-w-0">
                <PosStatusBar
                    scanStatus={scan.scanStatus}
                    pendingQty={numpad.pendingQty}
                    onCancelPendingQty={numpad.cancelPendingQty}
                />
                <PosSearchBar
                    value={search.search}
                    onChange={search.setSearch}
                    onClear={search.clearSearch}
                    onOpenCamera={() => setShowCameraScanner(true)}
                    inputRef={searchInputRef}
                />
                <div className="flex-1 overflow-y-auto rounded-md">
                    <PosProductGrid
                        results={search.searchResults}
                        isSearching={search.isSearching}
                        cart={cart.cart}
                        pendingQty={numpad.pendingQty}
                        query={search.search}
                        onSelectProduct={handleAddProduct}
                    />
                </div>
            </div>

            <PosCartPanel
                cart={cart}
                checkout={checkout}
                numpad={numpad}
                onClearCart={handleClearCart}
            />

            <PosPaymentModal cart={cart} checkout={checkout} />

            <PosCameraScannerModal
                isOpen={showCameraScanner}
                onClose={() => setShowCameraScanner(false)}
                onScan={scan.handleBarcodeScan}
            />
        </div>
    );
}
