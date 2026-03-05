import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import AuthLayout from '@/layouts/AuthLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
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

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Auth routes */}
                <Route
                    path={FRONTEND_ROUTES.LOGIN}
                    element={
                        <AuthLayout>
                            <LoginPage />
                        </AuthLayout>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.OTP_VERIFICATION}
                    element={
                        <AuthLayout>
                            <OtpVerificationPage />
                        </AuthLayout>
                    }
                />

                {/* Dashboard routes */}
                <Route
                    path={FRONTEND_ROUTES.DASHBOARD}
                    element={
                        <DashboardLayout>
                            <DashboardPage />
                        </DashboardLayout>
                    }
                />

                {/* Inventory routes */}
                <Route
                    path={FRONTEND_ROUTES.INVENTORY}
                    element={
                        <DashboardLayout>
                            <InventoryListPage />
                        </DashboardLayout>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.INVENTORY_ADD}
                    element={
                        <DashboardLayout>
                            <ProductFormPage />
                        </DashboardLayout>
                    }
                />

                {/* POS route */}
                <Route
                    path={FRONTEND_ROUTES.POS}
                    element={
                        <DashboardLayout>
                            <PosPage />
                        </DashboardLayout>
                    }
                />

                {/* Accounting routes */}
                <Route
                    path={FRONTEND_ROUTES.LEDGER}
                    element={
                        <DashboardLayout>
                            <LedgerPage />
                        </DashboardLayout>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.EXPENSES}
                    element={
                        <DashboardLayout>
                            <ExpensesPage />
                        </DashboardLayout>
                    }
                />

                {/* User routes */}
                <Route
                    path={FRONTEND_ROUTES.USER_MANAGEMENT}
                    element={
                        <DashboardLayout>
                            <UserManagementPage />
                        </DashboardLayout>
                    }
                />
                <Route
                    path={FRONTEND_ROUTES.PROFILE}
                    element={
                        <DashboardLayout>
                            <ProfilePage />
                        </DashboardLayout>
                    }
                />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to={FRONTEND_ROUTES.LOGIN} replace />} />
            </Routes>
        </BrowserRouter>
    );
}
