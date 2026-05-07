import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { FRONTEND_ROUTES } from '@/constants/routes';
import {
    inventoryService,
    type IProduct,
} from '@/services/inventory.service';
import { stockTransfersService } from '@/services/stock-transfers.service';

interface FormErrors {
    productId?: string;
    requestedQuantity?: string;
}

export default function NewTransferRequestPage() {
    const navigate = useNavigate();

    const [products, setProducts] = useState<IProduct[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [productSearch, setProductSearch] = useState('');
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

    const filteredProducts = useMemo(() => {
        const term = productSearch.trim().toLowerCase();
        if (!term) return products.slice(0, 50);
        return products
            .filter(
                (p) =>
                    p.name.toLowerCase().includes(term) ||
                    p.barcode.toLowerCase().includes(term),
            )
            .slice(0, 50);
    }, [products, productSearch]);

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
                    className="text-xs text-slate-500 hover:text-white transition-colors mb-3 flex items-center gap-1"
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
                <h1 className="text-2xl font-bold text-white tracking-tight">
                    New transfer request
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Tell admin what your branch needs from another branch.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-6"
            >
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Product
                    </label>
                    <input
                        type="text"
                        placeholder="Search by name or barcode…"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all placeholder:text-slate-600"
                    />
                    <div className="mt-3 max-h-60 overflow-y-auto bg-[#0a0a0a] border border-white/10 rounded-xl divide-y divide-white/5">
                        {productsLoading ? (
                            <div className="p-4 text-sm text-slate-500">
                                Loading products…
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="p-4 text-sm text-slate-500">
                                No products match your search.
                            </div>
                        ) : (
                            filteredProducts.map((p) => {
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
                                                ? 'bg-white/10'
                                                : 'hover:bg-white/[0.03]'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-medium text-slate-200">
                                                    {p.name}
                                                </p>
                                                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                                    {p.barcode}
                                                </p>
                                            </div>
                                            <span className="text-[11px] text-slate-500">
                                                {p.category}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                    {selectedProduct && (
                        <p className="text-xs text-slate-400 mt-2">
                            Selected:{' '}
                            <span className="text-white font-medium">
                                {selectedProduct.name}
                            </span>
                        </p>
                    )}
                    {errors.productId && (
                        <p className="text-xs text-red-400 mt-1">
                            {errors.productId}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Quantity needed
                    </label>
                    <input
                        type="number"
                        min={1}
                        value={requestedQuantity}
                        onChange={(e) => setRequestedQuantity(e.target.value)}
                        className={`w-full h-11 px-4 bg-[#0a0a0a] border rounded-xl text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all placeholder:text-slate-600 ${
                            errors.requestedQuantity
                                ? 'border-red-500/50'
                                : 'border-white/10'
                        }`}
                        placeholder="e.g. 50"
                    />
                    {errors.requestedQuantity && (
                        <p className="text-xs text-red-400 mt-1">
                            {errors.requestedQuantity}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Reason (optional)
                    </label>
                    <textarea
                        value={requestReason}
                        onChange={(e) => setRequestReason(e.target.value)}
                        rows={3}
                        maxLength={500}
                        className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all placeholder:text-slate-600 resize-none"
                        placeholder="Why does your branch need this transfer?"
                    />
                    <p className="text-[11px] text-slate-600 mt-1">
                        {requestReason.length} / 500
                    </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                    <button
                        type="button"
                        onClick={() => navigate(FRONTEND_ROUTES.TRANSFERS)}
                        disabled={isSubmitting}
                        className="h-10 px-5 rounded-xl border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="h-10 px-5 rounded-xl bg-white text-slate-900 text-sm font-bold hover:shadow-[0_8px_24px_rgba(255,255,255,0.15)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                        {isSubmitting ? 'Submitting…' : 'Submit request'}
                    </button>
                </div>
            </form>
        </div>
    );
}
