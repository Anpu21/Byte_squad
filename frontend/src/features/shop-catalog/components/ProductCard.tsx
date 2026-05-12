import { Link } from 'react-router-dom';
import { Plus, Store } from 'lucide-react';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/lib/utils';
import ProductImage from '@/components/shop/ProductImage';
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
            className={`bg-surface border border-border rounded-md overflow-hidden hover:border-border-strong transition-colors ${
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
                    fallback={<span className="text-text-3 text-xs">No image</span>}
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
            <div className="p-3">
                <p className="text-[11px] text-text-3 uppercase tracking-widest">
                    {product.category}
                </p>
                <Link to={detailHref} className="block">
                    <h3 className="text-sm font-semibold text-text-1 mt-1 line-clamp-2 min-h-[2.5em] hover:text-primary transition-colors">
                        {product.name}
                    </h3>
                </Link>
                <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-text-1">
                        {formatCurrency(product.sellingPrice)}
                    </p>
                    <button
                        type="button"
                        onClick={() => onAdd(product)}
                        disabled={out}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-colors ${
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
                {out && product.availableBranches.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-[10px] uppercase tracking-widest text-text-3 mb-1.5 flex items-center gap-1">
                            <Store size={10} /> Available at
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {product.availableBranches.map((b) => (
                                <button
                                    key={b.id}
                                    type="button"
                                    onClick={() => onBranchSelect(b.id)}
                                    className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-accent-soft text-accent-text border border-accent/40 hover:bg-accent-soft transition-colors"
                                >
                                    {b.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
