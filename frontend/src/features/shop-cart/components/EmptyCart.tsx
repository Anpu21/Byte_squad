import { Link } from 'react-router-dom';
import { LuShoppingCart as ShoppingCart } from 'react-icons/lu';
import { FRONTEND_ROUTES } from '@/constants/routes';

export function EmptyCart() {
    return (
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center text-center py-24">
            <div className="w-16 h-16 rounded-full bg-surface-2 border border-border flex items-center justify-center mb-5 shadow-sm-token">
                <ShoppingCart size={24} className="text-text-2" />
            </div>
            <h1 className="text-2xl font-bold text-text-1 tracking-tight mb-2">
                Your cart is empty
            </h1>
            <p className="text-sm text-text-2 mb-6">
                Add some products to get started.
            </p>
            <Link
                to={FRONTEND_ROUTES.SHOP}
                className="inline-flex items-center justify-center h-11 px-5 bg-primary text-text-inv font-semibold rounded-md hover:bg-primary-hover transition-colors"
            >
                Browse products
            </Link>
        </div>
    );
}
