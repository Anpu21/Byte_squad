import { useRef } from 'react';
import type { IProduct } from '@/types';
import { useTransferRequestCreatePage } from '@/features/transfer-request-create/hooks/useTransferRequestCreatePage';
import { usePosBarcodeScan } from '@/features/pos/hooks/usePosBarcodeScan';
import { TransferRequestCartPanel } from '@/features/transfer-request-create/components/TransferRequestCartPanel';

export function NewTransferRequestPage() {
    const p = useTransferRequestCreatePage();
    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleAddProduct = (product: IProduct) =>
        p.cart.addToCart(product, 1);

    const scan = usePosBarcodeScan({
        onProductFound: handleAddProduct,
        enabled: true,
    });

    return (
        <div className="h-[calc(100dvh-6.5rem)] lg:h-[calc(100dvh-7.5rem)] flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {scan.scanStatus && (
                <div
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    className="px-4 py-2 bg-surface-2 border border-border rounded-xl text-sm text-text-1 font-medium animate-in fade-in duration-200"
                >
                    {scan.scanStatus}
                </div>
            )}

            <TransferRequestCartPanel
                lines={p.cart.lines}
                totalUnits={p.cart.totalUnits}
                onUpdateQuantity={p.cart.updateQuantity}
                onRemove={p.cart.removeFromCart}
                onSelectProduct={handleAddProduct}
                reason={p.reason}
                onReasonChange={p.setReason}
                hasReason={p.hasReason}
                onSubmit={p.handleSubmit}
                canSubmit={p.canSubmit}
                isSubmitting={p.isSubmitting}
                inputRef={searchInputRef}
                onBack={p.goBack}
            />
        </div>
    );
}
