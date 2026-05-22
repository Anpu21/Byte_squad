import { Link } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';

export function OrderNotFound() {
    return (
        <div className="max-w-md mx-auto text-center py-24">
            <h1 className="text-xl font-bold text-text-1 tracking-tight mb-2">
                Order not found
            </h1>
            <p className="text-sm text-text-2 mb-6">
                The order code may be invalid or expired.
            </p>
            <Link
                to={FRONTEND_ROUTES.SHOP}
                className="inline-block px-4 py-2 bg-primary text-text-inv font-semibold rounded-lg hover:bg-primary-hover transition-colors"
            >
                Browse products
            </Link>
        </div>
    );
}
