import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { inventoryService } from '@/services/inventory.service';
import { stockTransfersService } from '@/services/stock-transfers.service';
import type { IProduct } from '@/types';

interface FormErrors {
    productId?: string;
    requestedQuantity?: string;
}

export function NewTransferRequestPage() {
    const navigate = useNavigate();

    const [products, setProducts] = useState<IProduct[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [productSearch, setProductSearch] = useState('');
    const [visibleCount, setVisibleCount] = useState(50);
    const [selectedProductId, setSelectedProductId] = useState<string>('');

    const [requestedQuantity, setRequestedQuantity] = useState('');
    const [requestReason, setRequestReason] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        let active = true;
        inventoryService
            .getProducts()
            .then((list) => {
                if (active) {
                    setProducts(list.filter((p) => p.isActive));
                }
            })
            .catch(() => {
                toast.error('Could not load products');
            })
            .finally(() => {
                if (active) setProductsLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    // Reset pagination when the search term changes so users see fresh results.
    useEffect(() => {
        setVisibleCount(50);
    }, [productSearch]);

    const matchedProducts = useMemo(() => {
        const term = productSearch.trim().toLowerCase();
        if (!term) return products;
        return products.filter(
            (p) =>
                p.name.toLowerCase().includes(term) ||
                p.barcode.toLowerCase().includes(term),
        );
    }, [products, productSearch]);

    const filteredProducts = useMemo(
        () => matchedProducts.slice(0, visibleCount),
        [matchedProducts, visibleCount],
    );

    const remainingCount = Math.max(0, matchedProducts.length - visibleCount);

    const selectedProduct = useMemo(
        () => products.find((p) => p.id === selectedProductId) ?? null,
        [products, selectedProductId],
    );

    const validate = (): boolean => {
        const next: FormErrors = {};
        if (!selectedProductId) {
            next.productId = 'Please select a product';
        }
        const qty = parseInt(requestedQuantity, 10);
        if (!requestedQuantity || Number.isNaN(qty) || qty < 1) {
            next.requestedQuantity = 'Quantity must be 1 or more';
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);
        try {
            await stockTransfersService.create({
                productId: selectedProductId,
                requestedQuantity: parseInt(requestedQuantity, 10),
                requestReason: requestReason.trim() || undefined,
            });
            toast.success('Transfer request submitted');
            navigate(FRONTEND_ROUTES.TRANSFERS);
        } catch (err) {
            const message =
                axios.isAxiosError(err) && err.response?.data?.message
                    ? String(err.response.data.message)
                    : 'Failed to submit transfer request';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-300 max-w-3xl">
            <div className="mb-6">
                <button
                    onClick={() => navigate(FRONTEND_ROUTES.TRANSFERS)}
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
                onSubmit={handleSubmit}
                className="bg-surface border border-border rounded-md shadow-2xl p-6 space-y-6"
            >
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-3 mb-2">
                        Product
                    </label>
                    <input
                        type="text"
                        placeholder="Search by name or barcode…"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full h-11 px-4 bg-canvas border border-border rounded-xl text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-all placeholder:text-text-3"
                    />
                    <div className="mt-3 max-h-60 overflow-y-auto bg-canvas border border-border rounded-xl divide-y divide-border">
                        {productsLoading ? (
                            <div className="p-4 text-sm text-text-3">
                                Loading products…
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="p-4 text-sm text-text-3">
                                No products match your search.
                            </div>
                        ) : (
                            <>
                                {filteredProducts.map((p) => {
                                    const isActive = selectedProductId === p.id;
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() =>
                                                setSelectedProductId(p.id)
                                            }
                                            className={`w-full text-left px-4 py-3 transition-colors ${
                                                isActive
                                                    ? 'bg-primary-soft'
                                                    : 'hover:bg-surface-2'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-medium text-text-1">
                                                        {p.name}
                                                    </p>
                                                    <p className="text-[11px] text-text-3 font-mono mt-0.5">
                                                        {p.barcode}
                                                    </p>
                                                </div>
                                                <span className="text-[11px] text-text-3">
                                                    {p.category}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                                {remainingCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setVisibleCount((n) => n + 50)}
                                        className="w-full text-center px-4 py-3 text-xs font-semibold text-primary hover:bg-surface-2 transition-colors"
                                    >
                                        Show {Math.min(50, remainingCount)} more
                                        <span className="text-text-3 font-normal">
                                            {' '}
                                            ({remainingCount} remaining)
                                        </span>
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                    {selectedProduct && (
                        <p className="text-xs text-text-2 mt-2">
                            Selected:{' '}
                            <span className="text-text-1 font-medium">
                                {selectedProduct.name}
                            </span>
                        </p>
                    )}
                    {errors.productId && (
                        <p className="text-xs text-danger mt-1">
                            {errors.productId}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-3 mb-2">
                        Quantity needed
                    </label>
                    <input
                        type="number"
                        min={1}
                        value={requestedQuantity}
                        onChange={(e) => setRequestedQuantity(e.target.value)}
                        className={`w-full h-11 px-4 bg-canvas border rounded-xl text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-all placeholder:text-text-3 ${
                            errors.requestedQuantity
                                ? 'border-danger'
                                : 'border-border'
                        }`}
                        placeholder="e.g. 50"
                    />
                    {errors.requestedQuantity && (
                        <p className="text-xs text-danger mt-1">
                            {errors.requestedQuantity}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-3 mb-2">
                        Reason (optional)
                    </label>
                    <textarea
                        value={requestReason}
                        onChange={(e) => setRequestReason(e.target.value)}
                        rows={3}
                        maxLength={500}
                        className="w-full px-4 py-3 bg-canvas border border-border rounded-xl text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-all placeholder:text-text-3 resize-none"
                        placeholder="Why does your branch need this transfer?"
                    />
                    <p className="text-[11px] text-text-3 mt-1">
                        {requestReason.length} / 500
                    </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                    <button
                        type="button"
                        onClick={() => navigate(FRONTEND_ROUTES.TRANSFERS)}
                        disabled={isSubmitting}
                        className="h-10 px-5 rounded-xl border border-border text-text-1 text-sm font-medium hover:bg-surface-2 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="h-10 px-5 rounded-xl bg-primary text-text-inv text-sm font-bold hover:bg-primary-hover transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? 'Submitting…' : 'Submit request'}
                    </button>
                </div>
            </form>
        </div>
    );
}
