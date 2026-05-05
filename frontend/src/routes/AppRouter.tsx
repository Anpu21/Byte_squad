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
import BranchesHubPage from '@/pages/admin/BranchesHubPage';
import BranchManagementPage from '@/pages/branches/BranchManagementPage';
import BranchPerformancePage from '@/pages/branches/BranchPerformancePage';
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
                        <ProtectedRoute>
                            <DashboardLayout>
                                <InventoryListPage />
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

                {/* Admin-only Branches Hub (overview + manage + compare tabs) */}
                <Route
                    path={FRONTEND_ROUTES.BRANCHES_HUB}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                            <DashboardLayout>
                                <BranchesHubPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Catch-all */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}
