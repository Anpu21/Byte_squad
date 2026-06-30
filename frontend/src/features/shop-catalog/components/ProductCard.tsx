import { Link } from 'react-router-dom';
import { LuPlus as Plus, LuStore as Store, LuShoppingBag as ShoppingBag } from 'react-icons/lu';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/lib/utils';
import ProductImage from '@/components/shop/ProductImage';
import { StarRating } from '@/components/ui';
import type { IShopProduct } from '@/types';
import { STOCK_LABEL, STOCK_PILL, STOCK_DOT } from '../lib/stock-style';

interface ProductCardProps {
    product: IShopProduct;
    onAdd: (product: IShopProduct) => void;
    onBranchSelect: (branchId: string) => void;
}

export function ProductCard({
    product,
    onAdd,
    onBranchSelect,
}: ProductCardProps) {
    const out = product.stockStatus === 'out';
    const detailHref = FRONTEND_ROUTES.SHOP_PRODUCT_DETAIL.replace(
        ':id',
        product.id,
    );

    return (
        <div
            className={`flex h-full flex-col bg-surface border border-border rounded-2xl overflow-hidden shadow-sm-token hover:border-border-strong hover:shadow-md-token hover:-translate-y-0.5 transition-all duration-200 ${
                out ? 'opacity-60' : ''
            }`}
        >
            <Link
                to={detailHref}
                className="relative block aspect-square bg-canvas flex items-center justify-center overflow-hidden"
            >
                <ProductImage
                    src={product.imageUrl}
                    alt={product.name}
                    wrapperClassName="absolute inset-0 flex items-center justify-center"
                    imgClassName={
                        out
                            ? 'w-full h-full object-cover grayscale'
                            : 'w-full h-full object-cover'
                    }
                    fallback={
                        <ShoppingBag
                            size={34}
                            className="text-border-strong"
                            aria-hidden="true"
                        />
                    }
                />
                <span
                    className={`absolute top-2 right-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${STOCK_PILL[product.stockStatus]}`}
                >
                    <span
                        className={`w-1.5 h-1.5 rounded-full ${STOCK_DOT[product.stockStatus]}`}
                    />
                    {STOCK_LABEL[product.stockStatus]}
                </span>
            </Link>
            <div className="p-5 flex flex-1 flex-col">
                <p className="text-[11px] text-accent-text uppercase tracking-widest font-medium">
                    {product.category}
                </p>
                <Link to={detailHref} className="block">
                    <h3 className="text-[15px] font-semibold text-text-1 mt-1 line-clamp-2 min-h-[2.5em] hover:text-primary transition-colors">
                        {product.name}
                    </h3>
                </Link>
                {product.reviewCount > 0 && (
                    <div className="mt-1.5">
                        <StarRating
                            value={product.aggregateRating}
                            count={product.reviewCount}
                            size={13}
                        />
                    </div>
                )}
                {out && product.availableBranches.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 overflow-hidden">
                        <Store
                            size={11}
                            className="shrink-0 text-text-3"
                            aria-hidden="true"
                        />
                        <div className="flex items-center gap-1 overflow-hidden">
                            {product.availableBranches.slice(0, 2).map((b) => (
                                <button
                                    key={b.id}
                                    type="button"
                                    onClick={() => onBranchSelect(b.id)}
                                    className="shrink-0 max-w-[88px] truncate rounded-full border border-accent/40 bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent-text"
                                >
                                    {b.name}
                                </button>
                            ))}
                            {product.availableBranches.length > 2 && (
                                <span className="shrink-0 text-[10px] text-text-3">
                                    +{product.availableBranches.length - 2}
                                </span>
                            )}
                        </div>
                    </div>
                )}
                <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                    <p className="text-lg font-bold text-text-1 tabular-nums">
                        {formatCurrency(product.sellingPrice)}
                        <span className="text-xs font-medium text-text-3">
                            {' '}
                            / {product.baseUnit}
                        </span>
                    </p>
                    <button
                        type="button"
                        onClick={() => onAdd(product)}
                        disabled={out}
                        className={`inline-flex items-center gap-1 h-10 px-3.5 text-xs font-semibold rounded-md transition-colors ${
                            out
                                ? 'bg-surface-2 text-text-3 cursor-not-allowed'
                                : 'bg-primary text-text-inv hover:bg-primary-hover'
                        }`}
                    >
                        {out ? (
                            'Out of stock'
                        ) : (
                            <>
                                <Plus size={12} /> Add
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
