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
import { WorkerDashboardPage } from '@/pages/dashboard/WorkerDashboardPage';
import { ProductFormPage } from '@/pages/inventory/ProductFormPage';
import { InventoryWorkspacePage } from '@/pages/inventory/InventoryWorkspacePage';
import { PurchasesWorkspacePage } from '@/pages/purchases/PurchasesWorkspacePage';
import { StockAdjustmentNewPage } from '@/pages/inventory/StockAdjustmentNewPage';
import { ReturnNewPage } from '@/pages/inventory/ReturnNewPage';
import { PosPage } from '@/pages/pos/PosPage';
import { SalesPage } from '@/pages/sales/SalesPage';
import { AccountingPage } from '@/pages/accounting/AccountingPage';
import { AuditLogPage } from '@/pages/admin/AuditLogPage';
import { ReportsHubPage } from '@/pages/reports/ReportsHubPage';
import { UserManagementPage } from '@/pages/users/UserManagementPage';
import { ProfilePage } from '@/pages/users/ProfilePage';
import { NotificationsPage } from '@/pages/notifications/NotificationsPage';
import { NotificationDetailPage } from '@/pages/notifications/NotificationDetailPage';
import { BranchHubPage } from '@/pages/branches/BranchHubPage';
import { AdminLoyaltyPage } from '@/pages/admin/AdminLoyaltyPage';
import { ManagerLoyaltyPage } from '@/pages/manager/ManagerLoyaltyPage';
import { AdminHrPage } from '@/features/admin-hr';
import { EmployeeFormPage } from '@/features/employee-form';
import { TransferRequestsPage } from '@/pages/transfers/TransferRequestsPage';
import { NewTransferRequestPage } from '@/pages/transfers/NewTransferRequestPage';
import { TransferDetailPage } from '@/pages/transfers/TransferDetailPage';
import { AdminTransfersPage } from '@/pages/transfers/AdminTransfersPage';
import { AdminTransferCreatePage } from '@/pages/transfers/AdminTransferCreatePage';
import { ShipmentsListPage } from '@/pages/transfers/ShipmentsListPage';
import { ShipmentCreatePage } from '@/pages/transfers/ShipmentCreatePage';
import { ShipmentDetailPage } from '@/pages/transfers/ShipmentDetailPage';
import { CatalogPage } from '@/pages/shop/CatalogPage';
import { ProductDetailPage } from '@/pages/shop/ProductDetailPage';
import { CartPage } from '@/pages/shop/CartPage';
import { CheckoutPage } from '@/pages/shop/CheckoutPage';
import { OrderConfirmationPage } from '@/pages/shop/OrderConfirmationPage';
import { OrderGroupConfirmationPage } from '@/pages/shop/OrderGroupConfirmationPage';
import { PayhereGatewayPage } from '@/pages/shop/PayhereGatewayPage';
import { MyOrdersPage } from '@/pages/shop/MyOrdersPage';
import { CustomerProfilePage } from '@/pages/shop/ProfilePage';
import { RewardsPage } from '@/pages/shop/RewardsPage';
import { InventoryRedirect } from './InventoryRedirect';
import { FirstSetupOnly } from './FirstSetupOnly';
import { LegacyOrderConfirmationRedirect } from './LegacyOrderConfirmationRedirect';
import { TransferHistoryRedirect } from './TransferHistoryRedirect';
import { AdminHrRedirect } from './AdminHrRedirect';
import { AccountingRedirect } from './AccountingRedirect';
import { SalesRedirect } from './SalesRedirect';
import { LeavesRouteEntry } from './LeavesRouteEntry';

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
    {
        path: FRONTEND_ROUTES.WORKER_DASHBOARD,
        element: <WorkerDashboardPage />,
        allowedRoles: [UserRole.WORKER],
        layout: 'dashboard',
    },

    // ─── Inventory ───
    {
        path: FRONTEND_ROUTES.INVENTORY,
        element: <InventoryWorkspacePage />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.PURCHASES,
        element: <PurchasesWorkspacePage />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.INVENTORY_EXPIRY,
        element: <InventoryRedirect tab="expiry" />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.STOCK_ADJUSTMENT_NEW,
        element: <StockAdjustmentNewPage />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.STOCK_ADJUSTMENTS,
        element: <InventoryRedirect tab="adjustments" />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.RETURN_NEW,
        element: <ReturnNewPage />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.RETURNS,
        element: <InventoryRedirect tab="returns" />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.INVENTORY_ADD,
        element: <ProductFormPage />,
        allowedRoles: [UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.INVENTORY_EDIT,
        element: <ProductFormPage />,
        allowedRoles: [UserRole.MANAGER],
        layout: 'dashboard',
    },

    // ─── Categories → now an Inventory workspace tab (redirect legacy paths) ───
    {
        path: FRONTEND_ROUTES.ADMIN_CATEGORIES,
        element: <InventoryRedirect tab="categories" />,
        allowedRoles: [UserRole.ADMIN],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.MANAGER_CATEGORIES,
        element: <InventoryRedirect tab="categories" />,
        allowedRoles: [UserRole.MANAGER],
        layout: 'dashboard',
    },

    // ─── POS & Sales hub + legacy redirects ───
    {
        path: FRONTEND_ROUTES.POS,
        element: <PosPage />,
        allowedRoles: [UserRole.CASHIER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.SALES,
        element: <SalesPage />,
        allowedRoles: [UserRole.CASHIER, UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.TRANSACTIONS,
        element: <SalesRedirect tab="transactions" />,
        allowedRoles: [UserRole.CASHIER, UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },

    // ─── Accounting — unified hub + legacy redirects ───
    {
        path: FRONTEND_ROUTES.ACCOUNTING,
        element: <AccountingPage />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.LEDGER,
        element: <AccountingRedirect tab="ledger" />,
        allowedRoles: [UserRole.ADMIN],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.RECEIVABLES,
        element: <AccountingRedirect tab="receivables" />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.FINANCIAL_REPORTS,
        element: <AccountingRedirect tab="reports" />,
        allowedRoles: [UserRole.ADMIN],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.ADMIN_AUDIT,
        element: <AuditLogPage />,
        allowedRoles: [UserRole.ADMIN],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.ADMIN_SCHEMES,
        element: <SalesRedirect tab="schemes" />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.REPORTS,
        element: <ReportsHubPage />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.EXPENSES,
        element: <AccountingRedirect tab="expenses" />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.PROFIT_LOSS,
        element: <AccountingRedirect tab="profit-loss" />,
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
    // ─── Branches Hub (Admin + Manager) ───
    {
        path: FRONTEND_ROUTES.BRANCHES,
        element: <BranchHubPage />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.BRANCHES_HUB,
        element: <Navigate to={FRONTEND_ROUTES.BRANCHES} replace />,
    },
    {
        path: FRONTEND_ROUTES.BRANCH_COMPARE,
        element: (
            <Navigate
                to={`${FRONTEND_ROUTES.BRANCHES}?tab=compare&view=summary`}
                replace
            />
        ),
    },
    {
        path: FRONTEND_ROUTES.BRANCH_MANAGEMENT,
        element: <Navigate to={FRONTEND_ROUTES.BRANCHES} replace />,
    },
    {
        path: FRONTEND_ROUTES.ADMIN_LOYALTY,
        element: <AdminLoyaltyPage />,
        allowedRoles: [UserRole.ADMIN],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.MANAGER_LOYALTY,
        element: <ManagerLoyaltyPage />,
        allowedRoles: [UserRole.MANAGER],
        layout: 'dashboard',
    },

    // ─── HR (Admin + Manager) — unified workspace ───
    {
        path: FRONTEND_ROUTES.ADMIN_HR,
        element: <AdminHrPage />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.ADMIN_EMPLOYEES,
        element: <AdminHrRedirect tab="employees" />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.ADMIN_EMPLOYEE_NEW,
        element: <EmployeeFormPage />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.ADMIN_EMPLOYEE_EDIT,
        element: <EmployeeFormPage />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.ADMIN_ATTENDANCE,
        element: <AdminHrRedirect tab="attendance" />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.ADMIN_LEAVES,
        element: <LeavesRouteEntry />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.ADMIN_PAYROLL,
        element: <AdminHrRedirect tab="payroll" />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
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
        element: <TransferHistoryRedirect />,
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
        path: FRONTEND_ROUTES.ADMIN_TRANSFER_NEW,
        element: <AdminTransferCreatePage />,
        allowedRoles: [UserRole.ADMIN],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.ADMIN_TRANSFERS,
        element: <AdminTransfersPage />,
        allowedRoles: [UserRole.ADMIN],
        layout: 'dashboard',
    },

    // ─── Shipments (courier delivery tracking) ───
    {
        path: FRONTEND_ROUTES.SHIPMENTS,
        element: <ShipmentsListPage />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.WORKER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.SHIPMENT_NEW,
        element: <ShipmentCreatePage />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.SHIPMENT_DETAIL,
        element: <ShipmentDetailPage />,
        allowedRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.WORKER],
        layout: 'dashboard',
    },

    // ─── Cashier — scan pickup now lives inside the POS (mode switch) ───
    {
        path: FRONTEND_ROUTES.SCAN_ORDER,
        element: <Navigate to={FRONTEND_ROUTES.POS} replace />,
        allowedRoles: [UserRole.CASHIER],
        layout: 'dashboard',
    },
    {
        path: FRONTEND_ROUTES.SCAN_ORDER_LEGACY,
        element: <Navigate to={FRONTEND_ROUTES.POS} replace />,
        allowedRoles: [UserRole.CASHIER],
        layout: 'dashboard',
    },

    // ─── Customer orders — staff (admin / manager / cashier) ───
    {
        path: FRONTEND_ROUTES.CUSTOMER_ORDERS,
        element: <SalesRedirect tab="orders" />,
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
    {
        path: FRONTEND_ROUTES.SHOP_CHECKOUT_PAY,
        element: <PayhereGatewayPage />,
        allowedRoles: [UserRole.CUSTOMER],
        layout: 'customer-public',
    },
    // Public confirmation — anyone with the code can view (the QR is the credential)
    {
        path: FRONTEND_ROUTES.SHOP_ORDER_GROUP,
        element: <OrderGroupConfirmationPage />,
        guard: 'none',
        layout: 'customer-public',
    },
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
    {
        path: FRONTEND_ROUTES.SHOP_REWARDS,
        element: <RewardsPage />,
        allowedRoles: [UserRole.CUSTOMER],
        layout: 'customer',
    },
];
