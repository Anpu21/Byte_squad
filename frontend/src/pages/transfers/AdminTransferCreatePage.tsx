import { useRef, useState } from 'react';
import type { IProduct } from '@/types';
import { useAdminTransferCreatePage } from '@/features/admin-transfer-create/hooks/useAdminTransferCreatePage';
import { usePosBarcodeScan } from '@/features/pos/hooks/usePosBarcodeScan';
import { AdminTransferBranchPickers } from '@/features/admin-transfer-create/components/AdminTransferBranchPickers';
import { AdminTransferCartPanel } from '@/features/admin-transfer-create/components/AdminTransferCartPanel';
import { AdminTransferCameraScannerModal } from '@/features/admin-transfer-create/components/AdminTransferCameraScannerModal';

export function AdminTransferCreatePage() {
    const p = useAdminTransferCreatePage();
    const [showCameraScanner, setShowCameraScanner] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleAddProduct = (product: IProduct) =>
        p.cart.addToCart(product, 1);

    const scan = usePosBarcodeScan({
        onProductFound: handleAddProduct,
        enabled: !showCameraScanner,
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

            <AdminTransferBranchPickers
                branches={p.branches}
                sourceBranchId={p.sourceBranchId}
                destinationBranchId={p.destinationBranchId}
                onSourceChange={p.setSourceBranchId}
                onDestinationChange={p.setDestinationBranchId}
                onSwap={p.swapBranches}
                isLoading={p.branchesLoading}
            />

            <AdminTransferCartPanel
                sourceBranchId={p.sourceBranchId}
                destinationBranchId={p.destinationBranchId}
                sourceBranch={p.sourceBranch}
                destinationBranch={p.destinationBranch}
                lines={p.cart.lines}
                totalUnits={p.cart.totalUnits}
                onUpdateQuantity={p.cart.updateQuantity}
                onRemove={p.cart.removeFromCart}
                onSelectProduct={handleAddProduct}
                onOpenCamera={() => setShowCameraScanner(true)}
                onSubmit={p.handleSubmit}
                canSubmit={p.canSubmit}
                isSubmitting={p.isSubmitting}
                inputRef={searchInputRef}
            />

            <AdminTransferCameraScannerModal
                isOpen={showCameraScanner}
                onClose={() => setShowCameraScanner(false)}
                onScan={scan.handleBarcodeScan}
            />
        </div>
    );
}
