import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { UserRole } from '@/constants/enums';
import { useAuth } from '@/hooks/useAuth';
import AuthLayout from '@/layouts/AuthLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import ProtectedRoute from '@/routes/ProtectedRoute';
import PublicRoute from '@/routes/PublicRoute';
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import OtpVerificationPage from '@/pages/auth/OtpVerificationPage';
import ChangePasswordPage from '@/pages/auth/ChangePasswordPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import BranchSelectionPage from '@/pages/auth/BranchSelectionPage';
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
import { AdminInventoryPage } from '@/pages/admin/AdminInventoryPage';
import TransferRequestsPage from '@/pages/transfers/TransferRequestsPage';
import NewTransferRequestPage from '@/pages/transfers/NewTransferRequestPage';
import TransferHistoryPage from '@/pages/transfers/TransferHistoryPage';
import TransferDetailPage from '@/pages/transfers/TransferDetailPage';
import AdminTransfersPage from '@/pages/admin/AdminTransfersPage';
import CustomerRequestsPage from '@/pages/requests/CustomerRequestsPage';
import ScanRequestPage from '@/pages/pos/ScanRequestPage';
import CustomerLayout from '@/layouts/CustomerLayout';
import CatalogPage from '@/pages/shop/CatalogPage';
import ProductDetailPage from '@/pages/shop/ProductDetailPage';
import CartPage from '@/pages/shop/CartPage';
import CheckoutPage from '@/pages/shop/CheckoutPage';
import RequestConfirmationPage from '@/pages/shop/RequestConfirmationPage';
import MyRequestsPage from '@/pages/shop/MyRequestsPage';
import CustomerProfilePage from '@/pages/shop/ProfilePage';
import NotFoundPage from '@/pages/NotFoundPage';

function SmartRedirect() {
    const { user, isAuthenticated } = useAuth();
    if (!isAuthenticated || !user) {
        return <Navigate to={FRONTEND_ROUTES.LOGIN} replace />;
    }
    switch (user.role) {
        case UserRole.CASHIER:
            return <Navigate to={FRONTEND_ROUTES.CASHIER_DASHBOARD} replace />;
        case UserRole.CUSTOMER:
            if (!user.branchId) {
                return <Navigate to={FRONTEND_ROUTES.SELECT_BRANCH} replace />;
            }
            return <Navigate to={FRONTEND_ROUTES.SHOP} replace />;
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

// /select-branch is a first-time-setup screen. Customers who already have a
// branch should manage it from the shop profile instead.
function FirstSetupOnly({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    if (user?.branchId) {
        return <Navigate to={FRONTEND_ROUTES.SHOP_PROFILE} replace />;
    }
    return <>{children}</>;
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
                    path={FRONTEND_ROUTES.SIGNUP}
                    element={
                        <PublicRoute>
                            <AuthLayout>
                                <SignupPage />
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
                <Route
                    path={FRONTEND_ROUTES.FORGOT_PASSWORD}
                    element={
                        <PublicRoute>
                            <AuthLayout>
                                <ForgotPasswordPage />
                            </AuthLayout>
                        </PublicRoute>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.RESET_PASSWORD}
                    element={
                        <PublicRoute>
                            <AuthLayout>
                                <ResetPasswordPage />
                            </AuthLayout>
                        </PublicRoute>
                    }
                />

                {/* Branch selection — first-time setup only; existing
                    customers go through profile to change branches. */}
                <Route
                    path={FRONTEND_ROUTES.SELECT_BRANCH}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.CUSTOMER]}>
                            <FirstSetupOnly>
                                <AuthLayout>
                                    <BranchSelectionPage />
                                </AuthLayout>
                            </FirstSetupOnly>
                        </ProtectedRoute>
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
                        <ProtectedRoute
                            allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}
                        >
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

                {/* Customer storefront — login required (CUSTOMER role) */}
                <Route
                    path={FRONTEND_ROUTES.SHOP}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.CUSTOMER]}>
                            <CustomerLayout>
                                <CatalogPage />
                            </CustomerLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.SHOP_PRODUCT_DETAIL}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.CUSTOMER]}>
                            <CustomerLayout>
                                <ProductDetailPage />
                            </CustomerLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.SHOP_CART}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.CUSTOMER]}>
                            <CustomerLayout>
                                <CartPage />
                            </CustomerLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.SHOP_CHECKOUT}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.CUSTOMER]}>
                            <CustomerLayout>
                                <CheckoutPage />
                            </CustomerLayout>
                        </ProtectedRoute>
                    }
                />
                {/* Public confirmation — anyone with the code can view (the QR is the credential) */}
                <Route
                    path={FRONTEND_ROUTES.SHOP_REQUEST_CONFIRMATION}
                    element={
                        <CustomerLayout publicMode>
                            <RequestConfirmationPage />
                        </CustomerLayout>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.SHOP_MY_REQUESTS}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.CUSTOMER]}>
                            <CustomerLayout>
                                <MyRequestsPage />
                            </CustomerLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.SHOP_PROFILE}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.CUSTOMER]}>
                            <CustomerLayout>
                                <CustomerProfilePage />
                            </CustomerLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Catch-all */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}
