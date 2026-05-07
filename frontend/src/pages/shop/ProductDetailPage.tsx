import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { ChevronLeft, Plus, Minus, ShoppingCart } from 'lucide-react';
import { publicProductsService } from '@/services/public-products.service';
import { addToCart } from '@/store/slices/shopCartSlice';
import { FRONTEND_ROUTES } from '@/constants/routes';

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
    }).format(amount);
}

export default function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [qty, setQty] = useState(1);

    const { data: product, isLoading } = useQuery({
        queryKey: ['public-product', id],
        queryFn: () => publicProductsService.getProduct(id!),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-24 text-slate-500 text-sm">
                Product not found.
            </div>
        );
    }

    const handleAdd = () => {
        dispatch(
            addToCart({
                productId: product.id,
                name: product.name,
                sellingPrice: product.sellingPrice,
                imageUrl: product.imageUrl,
                quantity: qty,
            }),
        );
        toast.success(`${product.name} × ${qty} added`);
    };

    const handleBuyNow = () => {
        handleAdd();
        navigate(FRONTEND_ROUTES.SHOP_CART);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Link
                to={FRONTEND_ROUTES.SHOP}
                className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-6"
            >
                <ChevronLeft size={14} /> Back to catalog
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="aspect-square bg-[#111] border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center">
                    {product.imageUrl ? (
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-slate-600 text-sm">No image</span>
                    )}
                </div>

                <div>
                    <p className="text-[11px] uppercase tracking-widest text-slate-500">
                        {product.category}
                    </p>
                    <h1 className="text-2xl font-bold text-white tracking-tight mt-2">
                        {product.name}
                    </h1>
                    <p className="text-3xl font-bold text-white mt-4">
                        {formatCurrency(product.sellingPrice)}
                    </p>

                    {product.description && (
                        <p className="mt-4 text-sm text-slate-400 leading-relaxed">
                            {product.description}
                        </p>
                    )}

                    <div className="mt-8 flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-[#111] border border-white/10 rounded-lg p-1">
                            <button
                                type="button"
                                onClick={() => setQty((q) => Math.max(1, q - 1))}
                                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/5"
                            >
                                <Minus size={14} />
                            </button>
                            <span className="font-semibold text-white min-w-[2ch] text-center">
                                {qty}
                            </span>
                            <button
                                type="button"
                                onClick={() => setQty((q) => q + 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/5"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={handleAdd}
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#111] border border-white/10 hover:border-white/20 text-white font-semibold py-2.5 rounded-lg"
                        >
                            <ShoppingCart size={14} /> Add to cart
                        </button>
                        <button
                            type="button"
                            onClick={handleBuyNow}
                            className="flex-1 bg-white text-black font-semibold py-2.5 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            Buy now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
