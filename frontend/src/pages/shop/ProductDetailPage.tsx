import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { ChevronLeft, Plus, Minus, ShoppingCart } from 'lucide-react';
import { shopProductsService } from '@/services/shop-products.service';
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
        queryFn: () => shopProductsService.getProduct(id!),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-2 border-border-strong border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-24 text-text-3 text-sm">
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
                className="inline-flex items-center gap-1 text-sm text-text-2 hover:text-text-1 mb-6"
            >
                <ChevronLeft size={14} /> Back to catalog
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="aspect-square bg-[#111] border border-border rounded-md overflow-hidden flex items-center justify-center">
                    {product.imageUrl ? (
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-text-3 text-sm">No image</span>
                    )}
                </div>

                <div>
                    <p className="text-[11px] uppercase tracking-widest text-text-3">
                        {product.category}
                    </p>
                    <h1 className="text-2xl font-bold text-text-1 tracking-tight mt-2">
                        {product.name}
                    </h1>
                    <p className="text-3xl font-bold text-text-1 mt-4">
                        {formatCurrency(product.sellingPrice)}
                    </p>

                    {product.description && (
                        <p className="mt-4 text-sm text-text-2 leading-relaxed">
                            {product.description}
                        </p>
                    )}

                    <div className="mt-8 flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-[#111] border border-border rounded-lg p-1">
                            <button
                                type="button"
                                onClick={() => setQty((q) => Math.max(1, q - 1))}
                                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-2"
                            >
                                <Minus size={14} />
                            </button>
                            <span className="font-semibold text-text-1 min-w-[2ch] text-center">
                                {qty}
                            </span>
                            <button
                                type="button"
                                onClick={() => setQty((q) => q + 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-2"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={handleAdd}
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#111] border border-border hover:border-border-strong text-text-1 font-semibold py-2.5 rounded-lg"
                        >
                            <ShoppingCart size={14} /> Add to cart
                        </button>
                        <button
                            type="button"
                            onClick={handleBuyNow}
                            className="flex-1 bg-primary text-black font-semibold py-2.5 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            Buy now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
