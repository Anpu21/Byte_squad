import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '@shared/constants/routes';
import { useAppSelector } from '@store/hooks';

// Layouts
import AuthLayout from '@features/auth/components/AuthLayout';
import DashboardLayout from '@shared/components/DashboardLayout';

// Auth Pages
import LoginPage from '@features/auth/components/LoginPage';

// Dashboard Pages
import DashboardPage from '@features/dashboard/components/DashboardPage';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAppSelector((state) => state.auth);

    if (!isAuthenticated) {
        return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
    }

    return <>{children}</>;
};

// Public Route Wrapper (redirect if already authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAppSelector((state) => state.auth);

    if (isAuthenticated) {
        return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
    }

    return <>{children}</>;
};

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route element={<AuthLayout />}>
                <Route
                    path={ROUTES.AUTH.LOGIN}
                    element={
                        <PublicRoute>
                            <LoginPage />
                        </PublicRoute>
                    }
                />
            </Route>

            {/* Protected Routes */}
            <Route
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                <Route path={ROUTES.ADMIN.DASHBOARD} element={<DashboardPage />} />

                {/* Add more protected routes here */}
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to={ROUTES.AUTH.LOGIN} replace />} />
            <Route path="*" element={<Navigate to={ROUTES.AUTH.LOGIN} replace />} />
        </Routes>
    );
};

export default AppRoutes;
