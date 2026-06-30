import { Route } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { UserRole } from '@/constants/enums';
import { RequireRole } from '../guards';
import { AdminHrRedirect } from '../redirects';
import { LeavesRouteEntry } from '../routeEntries';
import { NotificationsPage } from '@/features/notifications';
import { NotificationDetailPage } from '@/features/notification-detail';
import { ProfilePage } from '@/features/admin-user-profile';
import { UserManagementPage } from '@/features/user-management';
import { AdminLoyaltyPage, ManagerLoyaltyPage } from '@/features/admin-loyalty';
import { BranchHubPage } from '@/features/branch-hub';
import { AdminHrPage } from '@/features/admin-hr';
import { EmployeeFormPage } from '@/features/employee-form';
import { ReviewModerationPage } from '@/features/admin-reviews';

/**
 * People & org — notifications, profile, users, loyalty, branches, HR.
 * Wrapped by `DashboardLayout` in the aggregator.
 */
export const peopleRoutes = (
    <>
        {/* Any authenticated user */}
        <Route
            path={FRONTEND_ROUTES.NOTIFICATIONS}
            element={<NotificationsPage />}
            handle={{ crumbs: ['Notifications'] }}
        />
        <Route
            path={FRONTEND_ROUTES.NOTIFICATION_DETAIL}
            element={<NotificationDetailPage />}
            handle={{ crumbs: ['Notifications', 'Detail'] }}
        />
        <Route
            path={FRONTEND_ROUTES.PROFILE}
            element={<ProfilePage />}
            handle={{ crumbs: ['Profile'] }}
        />

        <Route element={<RequireRole roles={[UserRole.ADMIN]} />}>
            <Route
                path={FRONTEND_ROUTES.USER_MANAGEMENT}
                element={<UserManagementPage />}
                handle={{ crumbs: ['People', 'Users'] }}
            />
            <Route
                path={FRONTEND_ROUTES.ADMIN_LOYALTY}
                element={<AdminLoyaltyPage />}
                handle={{ crumbs: ['Admin', 'Customer loyalty'] }}
            />
        </Route>

        <Route element={<RequireRole roles={[UserRole.MANAGER]} />}>
            <Route
                path={FRONTEND_ROUTES.MANAGER_LOYALTY}
                element={<ManagerLoyaltyPage />}
                handle={{ crumbs: ['Manager', 'Customer loyalty'] }}
            />
        </Route>

        <Route element={<RequireRole roles={[UserRole.ADMIN, UserRole.MANAGER]} />}>
            <Route
                path={FRONTEND_ROUTES.ADMIN_REVIEWS}
                element={<ReviewModerationPage />}
                handle={{ crumbs: ['Storefront', 'Reviews'] }}
            />
            <Route
                path={FRONTEND_ROUTES.BRANCHES}
                element={<BranchHubPage />}
                handle={{ crumbs: ['Branches'] }}
            />
            <Route
                path={FRONTEND_ROUTES.ADMIN_HR}
                element={<AdminHrPage />}
                handle={{ crumbs: ['People', 'HR'] }}
            />
            <Route
                path={FRONTEND_ROUTES.ADMIN_EMPLOYEES}
                element={<AdminHrRedirect tab="employees" />}
                handle={{ crumbs: ['People', 'Employees'] }}
            />
            <Route
                path={FRONTEND_ROUTES.ADMIN_EMPLOYEE_NEW}
                element={<EmployeeFormPage />}
                handle={{ crumbs: ['People', 'Employees', 'Add new'] }}
            />
            <Route
                path={FRONTEND_ROUTES.ADMIN_EMPLOYEE_EDIT}
                element={<EmployeeFormPage />}
                handle={{ crumbs: ['People', 'Employees', 'Edit'] }}
            />
            <Route
                path={FRONTEND_ROUTES.ADMIN_ATTENDANCE}
                element={<AdminHrRedirect tab="attendance" />}
                handle={{ crumbs: ['People', 'Attendance'] }}
            />
            <Route
                path={FRONTEND_ROUTES.ADMIN_PAYROLL}
                element={<AdminHrRedirect tab="payroll" />}
                handle={{ crumbs: ['People', 'Payroll'] }}
            />
        </Route>

        <Route
            element={
                <RequireRole
                    roles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]}
                />
            }
        >
            <Route
                path={FRONTEND_ROUTES.ADMIN_LEAVES}
                element={<LeavesRouteEntry />}
                handle={{ crumbs: ['People', 'Leaves'] }}
            />
        </Route>
    </>
);
