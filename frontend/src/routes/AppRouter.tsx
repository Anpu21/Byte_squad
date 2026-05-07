import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { UserRole } from '@/constants/enums';
import { useAuth } from '@/hooks/useAuth';
import AuthLayout from '@/layouts/AuthLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import ProtectedRoute from '@/routes/ProtectedRoute';
import PublicRoute from '@/routes/PublicRoute';
import LoginPage from '@/pages/auth/LoginPage';
import OtpVerificationPage from '@/pages/auth/OtpVerificationPage';
import ChangePasswordPage from '@/pages/auth/ChangePasswordPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import CashierDashboardPage from '@/pages/dashboard/CashierDashboardPage';
import InventoryListPage from '@/pages/inventory/InventoryListPage';
import ProductFormPage from '@/pages/inventory/ProductFormPage';
import PosPage from '@/pages/pos/PosPage';
import TransactionsPage from '@/pages/pos/TransactionsPage';
import LedgerPage from '@/pages/accounting/LedgerPage';
import ExpensesPage from '@/pages/accounting/ExpensesPage';
import ProfitLossPage from '@/pages/accounting/ProfitLossPage';
import UserManagementPage from '@/pages/users/UserManagementPage';
import ProfilePage from '@/pages/users/ProfilePage';
import NotificationsPage from '@/pages/notifications/NotificationsPage';
import NotificationDetailPage from '@/pages/notifications/NotificationDetailPage';
import BranchManagementPage from '@/pages/branches/BranchManagementPage';
import BranchPerformancePage from '@/pages/branches/BranchPerformancePage';
import BranchComparisonPage from '@/pages/admin/BranchComparisonPage';
import AdminInventoryPage from '@/pages/admin/AdminInventoryPage';
import TransferRequestsPage from '@/pages/transfers/TransferRequestsPage';
import NewTransferRequestPage from '@/pages/transfers/NewTransferRequestPage';
import TransferHistoryPage from '@/pages/transfers/TransferHistoryPage';
import TransferDetailPage from '@/pages/transfers/TransferDetailPage';
import AdminTransfersPage from '@/pages/admin/AdminTransfersPage';
import CustomerRequestsPage from '@/pages/requests/CustomerRequestsPage';
import ScanRequestPage from '@/pages/pos/ScanRequestPage';
import CustomerLayout from '@/layouts/CustomerLayout';
import CustomerProtectedRoute from '@/routes/CustomerProtectedRoute';
import CatalogPage from '@/pages/shop/CatalogPage';
import ProductDetailPage from '@/pages/shop/ProductDetailPage';
import CartPage from '@/pages/shop/CartPage';
import CheckoutPage from '@/pages/shop/CheckoutPage';
import RequestConfirmationPage from '@/pages/shop/RequestConfirmationPage';
import MyRequestsPage from '@/pages/shop/MyRequestsPage';
import CustomerLoginPage from '@/pages/shop/CustomerLoginPage';
import CustomerSignupPage from '@/pages/shop/CustomerSignupPage';
import CustomerOtpPage from '@/pages/shop/CustomerOtpPage';
import NotFoundPage from '@/pages/NotFoundPage';

function SmartRedirect() {
    const { user, isAuthenticated } = useAuth();
    if (!isAuthenticated || !user) {
        return <Navigate to={FRONTEND_ROUTES.LOGIN} replace />;
    }
    switch (user.role) {
        case UserRole.CASHIER:
            return <Navigate to={FRONTEND_ROUTES.CASHIER_DASHBOARD} replace />;
        default:
            return <Navigate to={FRONTEND_ROUTES.DASHBOARD} replace />;
    }
}

function InventoryByRole() {
    const { user } = useAuth();
    return user?.role === UserRole.ADMIN ? (
        <AdminInventoryPage />
    ) : (
        <InventoryListPage />
    );
}

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Root redirect based on role */}
                <Route path="/" element={<SmartRedirect />} />

                {/* Auth routes — redirect to dashboard if already logged in */}
                <Route
                    path={FRONTEND_ROUTES.LOGIN}
                    element={
                        <PublicRoute>
                            <AuthLayout>
                                <LoginPage />
                            </AuthLayout>
                        </PublicRoute>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.OTP_VERIFICATION}
                    element={
                        <PublicRoute>
                            <AuthLayout>
                                <OtpVerificationPage />
                            </AuthLayout>
                        </PublicRoute>
                    }
                />

                {/* Change password — protected but no dashboard layout */}
                <Route
                    path={FRONTEND_ROUTES.CHANGE_PASSWORD}
                    element={
                        <ProtectedRoute>
                            <ChangePasswordPage />
                        </ProtectedRoute>
                    }
                />

                {/* Protected routes — redirect to login if not authenticated */}
                <Route
                    path={FRONTEND_ROUTES.DASHBOARD}
                    element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <DashboardPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path={FRONTEND_ROUTES.CASHIER_DASHBOARD}
                    element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <CashierDashboardPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path={FRONTEND_ROUTES.INVENTORY}
                    element={
                        <ProtectedRoute
                            allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}
                        >
                            <DashboardLayout>
                                <InventoryByRole />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.INVENTORY_ADD}
                    element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <ProductFormPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.INVENTORY_EDIT}
                    element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <ProductFormPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path={FRONTEND_ROUTES.POS}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.CASHIER]}>
                            <DashboardLayout>
                                <PosPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path={FRONTEND_ROUTES.TRANSACTIONS}
                    element={
                        <ProtectedRoute
                            allowedRoles={[UserRole.CASHIER, UserRole.ADMIN, UserRole.MANAGER]}
                        >
                            <DashboardLayout>
                                <TransactionsPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path={FRONTEND_ROUTES.LEDGER}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                            <DashboardLayout>
                                <LedgerPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.EXPENSES}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                            <DashboardLayout>
                                <ExpensesPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.PROFIT_LOSS}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                            <DashboardLayout>
                                <ProfitLossPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path={FRONTEND_ROUTES.USER_MANAGEMENT}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                            <DashboardLayout>
                                <UserManagementPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.NOTIFICATIONS}
                    element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <NotificationsPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.NOTIFICATION_DETAIL}
                    element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <NotificationDetailPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.PROFILE}
                    element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <ProfilePage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />

                {/* My Branch — manager single-branch performance */}
                <Route
                    path={FRONTEND_ROUTES.BRANCHES}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.MANAGER]}>
                            <DashboardLayout>
                                <BranchPerformancePage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Branch Management — admin-only CRUD (also embedded in the Branches Hub) */}
                <Route
                    path={FRONTEND_ROUTES.BRANCH_MANAGEMENT}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                            <DashboardLayout>
                                <BranchManagementPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Admin-only Branches (CRUD) */}
                <Route
                    path={FRONTEND_ROUTES.BRANCHES_HUB}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                            <DashboardLayout>
                                <BranchManagementPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Admin-only Compare (standalone) */}
                <Route
                    path={FRONTEND_ROUTES.BRANCH_COMPARE}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                            <DashboardLayout>
                                <BranchComparisonPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Stock Transfers — manager + admin */}
                <Route
                    path={FRONTEND_ROUTES.TRANSFERS}
                    element={
                        <ProtectedRoute
                            allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}
                        >
                            <DashboardLayout>
                                <TransferRequestsPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.TRANSFERS_NEW}
                    element={
                        <ProtectedRoute
                            allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}
                        >
                            <DashboardLayout>
                                <NewTransferRequestPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.TRANSFER_HISTORY}
                    element={
                        <ProtectedRoute
                            allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}
                        >
                            <DashboardLayout>
                                <TransferHistoryPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.TRANSFER_DETAIL}
                    element={
                        <ProtectedRoute
                            allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}
                        >
                            <DashboardLayout>
                                <TransferDetailPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.ADMIN_TRANSFERS}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                            <DashboardLayout>
                                <AdminTransfersPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Cashier — scan pickup request */}
                <Route
                    path={FRONTEND_ROUTES.SCAN_REQUEST}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.CASHIER]}>
                            <DashboardLayout>
                                <ScanRequestPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Customer requests — staff-shared with branch-scoping for non-admins */}
                <Route
                    path={FRONTEND_ROUTES.CUSTOMER_REQUESTS}
                    element={
                        <ProtectedRoute
                            allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]}
                        >
                            <DashboardLayout>
                                <CustomerRequestsPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Customer storefront (public + customer-protected) */}
                <Route
                    path={FRONTEND_ROUTES.SHOP}
                    element={
                        <CustomerLayout>
                            <CatalogPage />
                        </CustomerLayout>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.SHOP_PRODUCT_DETAIL}
                    element={
                        <CustomerLayout>
                            <ProductDetailPage />
                        </CustomerLayout>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.SHOP_CART}
                    element={
                        <CustomerLayout>
                            <CartPage />
                        </CustomerLayout>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.SHOP_CHECKOUT}
                    element={
                        <CustomerLayout>
                            <CheckoutPage />
                        </CustomerLayout>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.SHOP_REQUEST_CONFIRMATION}
                    element={
                        <CustomerLayout>
                            <RequestConfirmationPage />
                        </CustomerLayout>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.SHOP_LOGIN}
                    element={
                        <CustomerLayout>
                            <CustomerLoginPage />
                        </CustomerLayout>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.SHOP_SIGNUP}
                    element={
                        <CustomerLayout>
                            <CustomerSignupPage />
                        </CustomerLayout>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.SHOP_VERIFY_OTP}
                    element={
                        <CustomerLayout>
                            <CustomerOtpPage />
                        </CustomerLayout>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.SHOP_MY_REQUESTS}
                    element={
                        <CustomerProtectedRoute>
                            <CustomerLayout>
                                <MyRequestsPage />
                            </CustomerLayout>
                        </CustomerProtectedRoute>
                    }
                />

                {/* Catch-all */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}
