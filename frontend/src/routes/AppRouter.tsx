import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import AuthLayout from '@/layouts/AuthLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import ProtectedRoute from '@/routes/ProtectedRoute';
import PublicRoute from '@/routes/PublicRoute';
import LoginPage from '@/pages/auth/LoginPage';
import OtpVerificationPage from '@/pages/auth/OtpVerificationPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import InventoryListPage from '@/pages/inventory/InventoryListPage';
import ProductFormPage from '@/pages/inventory/ProductFormPage';
import PosPage from '@/pages/pos/PosPage';
import LedgerPage from '@/pages/accounting/LedgerPage';
import ExpensesPage from '@/pages/accounting/ExpensesPage';
import UserManagementPage from '@/pages/users/UserManagementPage';
import ProfilePage from '@/pages/users/ProfilePage';
import NotFoundPage from '@/pages/NotFoundPage';
export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Root redirect */}
                <Route path="/" element={<Navigate to={FRONTEND_ROUTES.DASHBOARD} replace />} />

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
                    path={FRONTEND_ROUTES.POS}
                    element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <PosPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path={FRONTEND_ROUTES.LEDGER}
                    element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <LedgerPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.EXPENSES}
                    element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <ExpensesPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path={FRONTEND_ROUTES.USER_MANAGEMENT}
                    element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <UserManagementPage />
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

                {/* Catch-all */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}
