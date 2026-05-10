import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { ChevronLeft, Plus, Minus, ShoppingCart, Store } from 'lucide-react';
import type { RootState } from '@/store';
import { shopProductsService } from '@/services/shop-products.service';
import {
    addToCart,
    clearShopCart,
    setBranch,
} from '@/store/slices/shopCartSlice';
import { useConfirm } from '@/hooks/useConfirm';
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
    const confirm = useConfirm();
    const [qty, setQty] = useState(1);
    const [imageFailed, setImageFailed] = useState(false);

    const cartItems = useSelector(
        (state: RootState) => state.shopCart.items,
    );
    const cartBranchId = useSelector(
        (state: RootState) => state.shopCart.branchId,
    );

    const { data: product, isLoading } = useQuery({
        queryKey: ['public-product', id, cartBranchId],
        queryFn: () =>
            shopProductsService.getProduct(id!, cartBranchId ?? undefined),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
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

    const availableIds = product.availableBranches.map((b) => b.id);
    const isOutEverywhere = availableIds.length === 0;
    const currentBranchHasIt =
        !!cartBranchId && availableIds.includes(cartBranchId);
    const branchSwitchNeeded = !currentBranchHasIt && !isOutEverywhere;

    const targetBranch =
        product.availableBranches.find((b) => b.id === cartBranchId) ??
        product.availableBranches[0] ??
        null;

    const handleAdd = async (): Promise<boolean> => {
        if (isOutEverywhere) {
            toast.error("This product isn't stocked anywhere right now");
            return false;
        }

        if (branchSwitchNeeded) {
            if (cartItems.length > 0) {
                const ok = await confirm({
                    title: 'Switch branch?',
                    body: `This item is at ${targetBranch?.name ?? 'another branch'}. Switching will clear your cart.`,
                    confirmLabel: 'Switch & clear cart',
                    tone: 'danger',
                });
                if (!ok) return false;
                dispatch(clearShopCart());
            }
            if (targetBranch) {
                dispatch(setBranch(targetBranch.id));
            }
        }

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
        return true;
    };

    const handleBuyNow = async () => {
        const added = await handleAdd();
        if (added) {
            navigate(FRONTEND_ROUTES.SHOP_CART);
        }
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
                <div className="aspect-square bg-surface border border-border rounded-md overflow-hidden flex items-center justify-center">
                    {product.imageUrl && !imageFailed ? (
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            onError={() => setImageFailed(true)}
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

                    {branchSwitchNeeded && targetBranch && (
                        <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-md bg-warning-soft border border-warning/40 text-xs text-warning">
                            <Store size={13} className="mt-0.5 flex-shrink-0" />
                            <span>
                                Available at <b>{targetBranch.name}</b>. Adding will switch your cart to that branch.
                            </span>
                        </div>
                    )}

                    <div className="mt-8 flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 bg-surface border border-border rounded-lg p-1">
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
                            disabled={isOutEverywhere}
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-surface border border-border-strong hover:bg-surface-2 text-text-1 font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ShoppingCart size={14} /> Add to cart
                        </button>
                        <button
                            type="button"
                            onClick={handleBuyNow}
                            disabled={isOutEverywhere}
                            className="flex-1 bg-primary text-text-inv font-semibold py-2.5 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Buy now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
