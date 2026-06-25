import { Navigate, Route } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { UserRole } from '@/constants/enums';
import { RequireRole } from '../guards';
import { LegacyOrderConfirmationRedirect } from '../redirects';
import CustomerLayout from '@/layouts/CustomerLayout';
import { CatalogPage } from '@/features/shop-catalog';
import { ProductDetailPage } from '@/features/product-detail';
import { CartPage } from '@/features/shop-cart';
import { CheckoutPage } from '@/features/checkout';
import {
    OrderConfirmationPage,
    OrderGroupConfirmationPage,
} from '@/features/order-confirmation';
import { PayhereGatewayPage } from '@/features/payhere-gateway';
import { MyOrdersPage } from '@/features/my-orders';
import { CustomerProfilePage } from '@/features/customer-profile';
import { RewardsPage } from '@/features/loyalty';

/**
 * Storefront — login required, CUSTOMER only. Nested under `ProtectedRoute` in
 * the aggregator. The payment gateway is CUSTOMER-gated but uses the chromeless
 * `publicMode` layout.
 */
export const customerProtectedRoutes = (
    <Route element={<RequireRole roles={[UserRole.CUSTOMER]} />}>
        <Route element={<CustomerLayout />}>
            <Route
                path={FRONTEND_ROUTES.SHOP}
                element={<CatalogPage />}
                handle={{ crumbs: ['Shop', 'Catalog'] }}
            />
            <Route
                path={FRONTEND_ROUTES.SHOP_PRODUCT_DETAIL}
                element={<ProductDetailPage />}
                handle={{ crumbs: ['Shop', 'Product'] }}
            />
            <Route
                path={FRONTEND_ROUTES.SHOP_CART}
                element={<CartPage />}
                handle={{ crumbs: ['Shop', 'Cart'] }}
            />
            <Route
                path={FRONTEND_ROUTES.SHOP_CHECKOUT}
                element={<CheckoutPage />}
                handle={{ crumbs: ['Shop', 'Checkout'] }}
            />
            <Route
                path={FRONTEND_ROUTES.SHOP_MY_ORDERS}
                element={<MyOrdersPage />}
                handle={{ crumbs: ['Shop', 'My orders'] }}
            />
            <Route
                path={FRONTEND_ROUTES.SHOP_MY_ORDERS_LEGACY}
                element={
                    <Navigate to={FRONTEND_ROUTES.SHOP_MY_ORDERS} replace />
                }
            />
            <Route
                path={FRONTEND_ROUTES.SHOP_PROFILE}
                element={<CustomerProfilePage />}
            />
            <Route
                path={FRONTEND_ROUTES.SHOP_REWARDS}
                element={<RewardsPage />}
            />
        </Route>
        <Route element={<CustomerLayout publicMode />}>
            <Route
                path={FRONTEND_ROUTES.SHOP_CHECKOUT_PAY}
                element={<PayhereGatewayPage />}
            />
        </Route>
    </Route>
);

/**
 * Public order confirmation — anyone with the code can view (the QR is the
 * credential). No guard; sits OUTSIDE `ProtectedRoute` in the aggregator.
 */
export const customerPublicRoutes = (
    <Route element={<CustomerLayout publicMode />}>
        <Route
            path={FRONTEND_ROUTES.SHOP_ORDER_GROUP}
            element={<OrderGroupConfirmationPage />}
        />
        <Route
            path={FRONTEND_ROUTES.SHOP_ORDER_CONFIRMATION}
            element={<OrderConfirmationPage />}
            handle={{ crumbs: ['Shop', 'Confirmation'] }}
        />
        <Route
            path={FRONTEND_ROUTES.SHOP_ORDER_CONFIRMATION_LEGACY}
            element={<LegacyOrderConfirmationRedirect />}
        />
    </Route>
);
