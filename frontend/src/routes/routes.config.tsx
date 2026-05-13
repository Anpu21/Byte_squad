import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { UserRole } from '@/constants/enums';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { OtpVerificationPage } from '@/pages/auth/OtpVerificationPage';
import { ChangePasswordPage } from '@/pages/auth/ChangePasswordPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { BranchSelectionPage } from '@/pages/auth/BranchSelectionPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { CashierDashboardPage } from '@/pages/dashboard/CashierDashboardPage';
import { ProductFormPage } from '@/pages/inventory/ProductFormPage';
import { PosPage } from '@/pages/pos/PosPage';
import { TransactionsPage } from '@/pages/pos/TransactionsPage';
import { LedgerPage } from '@/pages/accounting/LedgerPage';
import { ExpensesPage } from '@/pages/accounting/ExpensesPage';
import { ProfitLossPage } from '@/pages/accounting/ProfitLossPage';
import { UserManagementPage } from '@/pages/users/UserManagementPage';
import { ProfilePage } from '@/pages/users/ProfilePage';
import { NotificationsPage } from '@/pages/notifications/NotificationsPage';
import { NotificationDetailPage } from '@/pages/notifications/NotificationDetailPage';
import { BranchManagementPage } from '@/pages/branches/BranchManagementPage';
import { BranchPerformancePage } from '@/pages/branches/BranchPerformancePage';
import { BranchComparisonPage } from '@/pages/admin/BranchComparisonPage';
import { TransferRequestsPage } from '@/pages/transfers/TransferRequestsPage';
import { NewTransferRequestPage } from '@/pages/transfers/NewTransferRequestPage';
import { TransferHistoryPage } from '@/pages/transfers/TransferHistoryPage';
import { TransferDetailPage } from '@/pages/transfers/TransferDetailPage';
import { AdminTransfersPage } from '@/pages/admin/AdminTransfersPage';
import { CustomerOrdersPage } from '@/pages/orders/CustomerOrdersPage';
import { ScanOrderPage } from '@/pages/pos/ScanOrderPage';
import { CatalogPage } from '@/pages/shop/CatalogPage';
import { ProductDetailPage } from '@/pages/shop/ProductDetailPage';
import { CartPage } from '@/pages/shop/CartPage';
import { CheckoutPage } from '@/pages/shop/CheckoutPage';
import { OrderConfirmationPage } from '@/pages/shop/OrderConfirmationPage';
import { MyOrdersPage } from '@/pages/shop/MyOrdersPage';
import { CustomerProfilePage } from '@/pages/shop/ProfilePage';
import { InventoryByRole } from './InventoryByRole';
import { FirstSetupOnly } from './FirstSetupOnly';
import { LegacyOrderConfirmationRedirect } from './LegacyOrderConfirmationRedirect';

export type Guard = 'public' | 'protected' | 'none';
export type Layout =
    | 'auth'
    | 'dashboard'
    | 'customer'
    | 'customer-public'
    | 'none';

export interface RouteDef {
    path: string;
    element: ReactNode;
    guard?: Guard;
    allowedRoles?: UserRole[];
    layout?: Layout;
    innerWrap?: (children: ReactNode) => ReactNode;
}

export const ROUTES: RouteDef[] = [
    {
        path: FRONTEND_ROUTES.LOGIN,
        element: <LoginPage />,
        guard: 'public',
        layout: 'auth',
    },
    {
        path: FRONTEND_ROUTES.SIGNUP,
        element: <SignupPage />,
        guard: 'public',
        layout: 'auth',
    },
    {
        path: FRONTEND_ROUTES.OTP_VERIFICATION,
        element: <OtpVerificationPage />,
        guard: 'public',
        layout: 'auth',
    },
    {
        path: FRONTEND_ROUTES.FORGOT_PASSWORD,
        element: <ForgotPasswordPage />,
        guard: 'public',
        layout: 'auth',
    },
    {
        path: FRONTEND_ROUTES.RESET_PASSWORD,
        element: <ResetPasswordPage />,
        guard: 'public',
        layout: 'auth',
    },

    // ─── First-time setup: customer must pick a branch ───
    {
        path: FRONTEND_ROUTES.SELECT_BRANCH,
        element: <BranchSelectionPage />,
        allowedRoles: [UserRole.CUSTOMER],
        layout: 'auth',
        innerWrap: (c) => <FirstSetupOnly>{c}</FirstSetupOnly>,
    },

    // ─── Protected (no dashboard chrome) ───
    {
        path: FRONTEND_ROUTES.CHANGE_PASSWORD,
        element: <ChangePasswordPage />,
    },

    // ─── Dashboard ───
    {
        path: FRONTEND_ROUTES.DASHBOARD,
        element: <DashboardPage />,
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.CASHIER_DASHBOARD,
        element: <CashierDashboardPage />,
        layout: 'dashboard',
    },

    // ─── Inventory ───
    {
        path: FRONTEND_ROUTES.INVENTORY,
        element: <InventoryByRole />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.INVENTORY_ADD,
        element: <ProductFormPage />,
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.INVENTORY_EDIT,
        element: <ProductFormPage />,
        layout: 'dashboard',
    },

    // ─── POS ───
    {
        path: FRONTEND_ROUTES.POS,
        element: <PosPage />,
        allowedRoles: [UserRole.CASHIER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.TRANSACTIONS,
        element: <TransactionsPage />,
        allowedRoles: [UserRole.CASHIER, UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },

    // ─── Accounting ───
    {
        path: FRONTEND_ROUTES.LEDGER,
        element: <LedgerPage />,
        allowedRoles: [UserRole.ADMIN],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.EXPENSES,
        element: <ExpensesPage />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.PROFIT_LOSS,
        element: <ProfitLossPage />,
        allowedRoles: [UserRole.ADMIN],
        layout: 'dashboard',
    },

    // ─── Users / profile / notifications ───
    {
        path: FRONTEND_ROUTES.USER_MANAGEMENT,
        element: <UserManagementPage />,
        allowedRoles: [UserRole.ADMIN],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.NOTIFICATIONS,
        element: <NotificationsPage />,
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.NOTIFICATION_DETAIL,
        element: <NotificationDetailPage />,
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.PROFILE,
        element: <ProfilePage />,
        layout: 'dashboard',
    },

    // ─── Branches ───
    {
        path: FRONTEND_ROUTES.BRANCHES,
        element: <BranchPerformancePage />,
        allowedRoles: [UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.BRANCH_MANAGEMENT,
        element: <BranchManagementPage />,
        allowedRoles: [UserRole.ADMIN],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.BRANCHES_HUB,
        element: <BranchManagementPage />,
        allowedRoles: [UserRole.ADMIN],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.BRANCH_COMPARE,
        element: <BranchComparisonPage />,
        allowedRoles: [UserRole.ADMIN],
        layout: 'dashboard',
    },

    // ─── Stock Transfers ───
    {
        path: FRONTEND_ROUTES.TRANSFERS,
        element: <TransferRequestsPage />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.TRANSFERS_NEW,
        element: <NewTransferRequestPage />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.TRANSFER_HISTORY,
        element: <TransferHistoryPage />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.TRANSFER_DETAIL,
        element: <TransferDetailPage />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.ADMIN_TRANSFERS,
        element: <AdminTransfersPage />,
        allowedRoles: [UserRole.ADMIN],
        layout: 'dashboard',
    },

    // ─── Cashier — scan pickup order ───
    {
        path: FRONTEND_ROUTES.SCAN_ORDER,
        element: <ScanOrderPage />,
        allowedRoles: [UserRole.CASHIER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.SCAN_ORDER_LEGACY,
        element: <Navigate to={FRONTEND_ROUTES.SCAN_ORDER} replace />,
        allowedRoles: [UserRole.CASHIER],
        layout: 'dashboard',
    },

    // ─── Customer orders — staff (admin / manager / cashier) ───
    {
        path: FRONTEND_ROUTES.CUSTOMER_ORDERS,
        element: <CustomerOrdersPage />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER],
        layout: 'dashboard',
    },

    // ─── Customer storefront ───
    {
        path: FRONTEND_ROUTES.SHOP,
        element: <CatalogPage />,
        allowedRoles: [UserRole.CUSTOMER],
        layout: 'customer',
    },
    {
        path: FRONTEND_ROUTES.SHOP_PRODUCT_DETAIL,
        element: <ProductDetailPage />,
        allowedRoles: [UserRole.CUSTOMER],
        layout: 'customer',
    },
    {
        path: FRONTEND_ROUTES.SHOP_CART,
        element: <CartPage />,
        allowedRoles: [UserRole.CUSTOMER],
        layout: 'customer',
    },
    {
        path: FRONTEND_ROUTES.SHOP_CHECKOUT,
        element: <CheckoutPage />,
        allowedRoles: [UserRole.CUSTOMER],
        layout: 'customer',
    },
    // Public confirmation — anyone with the code can view (the QR is the credential)
    {
        path: FRONTEND_ROUTES.SHOP_ORDER_CONFIRMATION,
        element: <OrderConfirmationPage />,
        guard: 'none',
        layout: 'customer-public',
    },
    {
        path: FRONTEND_ROUTES.SHOP_ORDER_CONFIRMATION_LEGACY,
        element: <LegacyOrderConfirmationRedirect />,
        guard: 'none',
        layout: 'customer-public',
    },
    {
        path: FRONTEND_ROUTES.SHOP_MY_ORDERS,
        element: <MyOrdersPage />,
        allowedRoles: [UserRole.CUSTOMER],
        layout: 'customer',
    },
    {
        path: FRONTEND_ROUTES.SHOP_MY_ORDERS_LEGACY,
        element: <Navigate to={FRONTEND_ROUTES.SHOP_MY_ORDERS} replace />,
        allowedRoles: [UserRole.CUSTOMER],
        layout: 'customer',
    },
    {
        path: FRONTEND_ROUTES.SHOP_PROFILE,
        element: <CustomerProfilePage />,
        allowedRoles: [UserRole.CUSTOMER],
        layout: 'customer',
    },
];
