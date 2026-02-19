import { type ReactNode, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { FRONTEND_ROUTES } from '@shared/routes/frontend-routes';
import { UserRole } from '@shared/constants/enums';

interface DashboardLayoutProps {
    children: ReactNode;
}

interface NavItem {
    label: string;
    path: string;
    roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
    {
        label: 'Dashboard',
        path: FRONTEND_ROUTES.DASHBOARD,
        roles: [UserRole.ADMIN],
    },
    {
        label: 'POS',
        path: FRONTEND_ROUTES.POS,
        roles: [UserRole.CASHIER, UserRole.ADMIN, UserRole.MANAGER],
    },
    {
        label: 'Inventory',
        path: FRONTEND_ROUTES.INVENTORY,
        roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT],
    },
    {
        label: 'Ledger',
        path: FRONTEND_ROUTES.LEDGER,
        roles: [UserRole.ADMIN, UserRole.ACCOUNTANT],
    },
    {
        label: 'Expenses',
        path: FRONTEND_ROUTES.EXPENSES,
        roles: [UserRole.ADMIN, UserRole.ACCOUNTANT],
    },
    {
        label: 'Users',
        path: FRONTEND_ROUTES.USER_MANAGEMENT,
        roles: [UserRole.ADMIN],
    },
    {
        label: 'Branches',
        path: FRONTEND_ROUTES.BRANCHES,
        roles: [UserRole.ADMIN],
    },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { user, logout } = useAuth();
    const { unreadCount } = useNotifications();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const filteredNavItems = NAV_ITEMS.filter((item) =>
        user ? item.roles.includes(user.role as UserRole) : false,
    );

    return (
        <div className="min-h-screen bg-[var(--color-bg-dark)] flex">
            {/* Sidebar */}
            <aside
                className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 glass-card rounded-none border-r border-white/5 flex flex-col`}
            >
                {/* Logo */}
                <div className="p-4 border-b border-white/5">
                    <h2
                        className={`font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent ${sidebarOpen ? 'text-xl' : 'text-sm text-center'}`}
                    >
                        {sidebarOpen ? 'LedgerPro' : 'LP'}
                    </h2>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1">
                    {filteredNavItems.map((item) => (
                        <a
                            key={item.path}
                            href={item.path}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5 transition-all text-sm"
                        >
                            <span>{sidebarOpen ? item.label : item.label.charAt(0)}</span>
                        </a>
                    ))}
                </nav>

                {/* User info */}
                <div className="p-4 border-t border-white/5">
                    {user && sidebarOpen && (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300">
                                {user.firstName.charAt(0)}
                                {user.lastName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-white truncate">
                                    {user.firstName} {user.lastName}
                                </p>
                                <p className="text-xs text-[var(--color-text-muted)] capitalize">
                                    {user.role}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Top bar */}
                <header className="h-14 border-b border-white/5 flex items-center justify-between px-6">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="text-[var(--color-text-secondary)] hover:text-white transition-colors"
                    >
                        ☰
                    </button>

                    <div className="flex items-center gap-4">
                        {/* Notifications bell */}
                        <button className="relative text-[var(--color-text-secondary)] hover:text-white transition-colors">
                            🔔
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={logout}
                            className="text-xs text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-6 overflow-auto">{children}</main>
            </div>
        </div>
    );
}
