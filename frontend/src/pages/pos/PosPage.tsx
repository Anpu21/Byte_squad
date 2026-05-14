import { useCallback, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { IProduct } from '@/types';
import { usePosCart } from '@/features/pos/hooks/usePosCart';
import { usePosCheckout } from '@/features/pos/hooks/usePosCheckout';
import { usePosBarcodeScan } from '@/features/pos/hooks/usePosBarcodeScan';
import { usePosKeyboardShortcuts } from '@/features/pos/hooks/usePosKeyboardShortcuts';
import { useBranchStockMap } from '@/features/pos/hooks/useBranchStockMap';
import { PosStatusBar } from '@/features/pos/components/PosStatusBar';
import { PosCartPanel } from '@/features/pos/components/PosCartPanel';
import { PosPaymentModal } from '@/features/pos/components/PosPaymentModal';
import { PosCameraScannerModal } from '@/features/pos/components/PosCameraScannerModal';

export function PosPage() {
    const { user } = useAuth();
    const stockByProductId = useBranchStockMap(user?.branchId);
    const cart = usePosCart({ stockByProductId });
    const [showCameraScanner, setShowCameraScanner] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleAddProduct = useCallback(
        (product: IProduct) => {
            cart.addToCart(product, 1);
        },
        [cart],
    );

    const scan = usePosBarcodeScan({
        onProductFound: handleAddProduct,
        enabled: !showCameraScanner,
    });

    const checkout = usePosCheckout({
        cart: cart.cart,
        total: cart.total,
        onSuccess: () => {
            cart.setCart([]);
            requestAnimationFrame(() => searchInputRef.current?.focus());
        },
    });

    usePosKeyboardShortcuts({
        onFocusSearch: () => searchInputRef.current?.focus(),
        onOpenCheckout: checkout.openPaymentModal,
        onEscape: () => {
            if (checkout.showPaymentModal) checkout.closePaymentModal();
        },
        canCheckout: cart.cart.length > 0,
    });

    return (
        <div className="h-[calc(100dvh-6.5rem)] lg:h-[calc(100dvh-7.5rem)] flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <PosStatusBar scanStatus={scan.scanStatus} />

            <PosCartPanel
                cart={cart}
                checkout={checkout}
                branchId={user?.branchId}
                stockByProductId={stockByProductId}
                onOpenCamera={() => setShowCameraScanner(true)}
                inputRef={searchInputRef}
                onSelectProduct={handleAddProduct}
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
