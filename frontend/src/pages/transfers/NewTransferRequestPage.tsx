import { useNewTransferRequestPage } from '@/features/new-transfer-request/hooks/useNewTransferRequestPage';
import { ProductPicker } from '@/features/new-transfer-request/components/ProductPicker';
import { QuantityField } from '@/features/new-transfer-request/components/QuantityField';
import { ReasonField } from '@/features/new-transfer-request/components/ReasonField';

export function NewTransferRequestPage() {
    const p = useNewTransferRequestPage();

    return (
        <div className="animate-in fade-in duration-300 max-w-3xl">
            <div className="mb-6">
                <button
                    onClick={p.goBack}
                    className="text-xs text-text-3 hover:text-text-1 transition-colors mb-3 flex items-center gap-1"
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back to transfers
                </button>
                <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                    New transfer request
                </h1>
                <p className="text-sm text-text-3 mt-1">
                    Tell admin what your branch needs from another branch.
                </p>
            </div>

            <form
                onSubmit={p.handleSubmit}
                className="bg-surface border border-border rounded-md shadow-2xl p-6 space-y-6"
            >
                <ProductPicker
                    search={p.productSearch}
                    setSearch={p.setProductSearch}
                    products={p.filteredProducts}
                    isLoading={p.productsLoading}
                    selectedId={p.selectedProductId}
                    onSelect={p.setSelectedProductId}
                    selectedProduct={p.selectedProduct}
                    remainingCount={p.remainingCount}
                    onShowMore={p.showMore}
                    error={p.errors.productId}
                />

                <QuantityField
                    value={p.requestedQuantity}
                    onChange={p.setRequestedQuantity}
                    error={p.errors.requestedQuantity}
                />

                <ReasonField
                    value={p.requestReason}
                    onChange={p.setRequestReason}
                />

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                    <button
                        type="button"
                        onClick={p.goBack}
                        disabled={p.isSubmitting}
                        className="h-10 px-5 rounded-xl border border-border text-text-1 text-sm font-medium hover:bg-surface-2 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={p.isSubmitting}
                        className="h-10 px-5 rounded-xl bg-primary text-text-inv text-sm font-bold hover:bg-primary-hover transition-colors disabled:opacity-50"
                    >
                        {p.isSubmitting ? 'Submitting…' : 'Submit request'}
                    </button>
                </div>
            </form>
        </div>
    );
}
