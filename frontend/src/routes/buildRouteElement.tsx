import type { ReactNode } from 'react';
import type { UserRole } from '@/constants/enums';
import AuthLayout from '@/layouts/AuthLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import CustomerLayout from '@/layouts/CustomerLayout';
import ProtectedRoute from '@/routes/ProtectedRoute';
import PublicRoute from '@/routes/PublicRoute';
import type { Guard, Layout, RouteDef } from './routes.config';

type Wrapper = (children: ReactNode) => ReactNode;

const LAYOUTS: Record<Layout, Wrapper> = {
    auth: (c) => <AuthLayout>{c}</AuthLayout>,
    dashboard: (c) => <DashboardLayout>{c}</DashboardLayout>,
    customer: (c) => <CustomerLayout>{c}</CustomerLayout>,
    'customer-public': (c) => <CustomerLayout publicMode>{c}</CustomerLayout>,
    none: (c) => <>{c}</>,
};

function guardFor(guard: Guard, allowedRoles?: UserRole[]): Wrapper {
    switch (guard) {
        case 'public':
            return (c) => <PublicRoute>{c}</PublicRoute>;
        case 'protected':
            return (c) => (
                <ProtectedRoute allowedRoles={allowedRoles}>{c}</ProtectedRoute>
            );
        case 'none':
            return (c) => <>{c}</>;
    }
}

export function buildRouteElement(def: RouteDef): ReactNode {
    const wrappers: Wrapper[] = [
        def.innerWrap ?? ((c) => c),
        LAYOUTS[def.layout ?? 'none'],
        guardFor(def.guard ?? 'protected', def.allowedRoles),
    ];
    return wrappers.reduce<ReactNode>((node, wrap) => wrap(node), def.element);
}
