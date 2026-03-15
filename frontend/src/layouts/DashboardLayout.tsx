import { type ReactNode, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { UserRole } from '@/constants/enums';

interface DashboardLayoutProps {
    children: ReactNode;
}

interface NavItem {
    label: string;
    path: string;
    roles: UserRole[];
    // Added icons for a more premium sidebar
    icon: ReactNode; 
}

const NAV_ITEMS: NavItem[] = [
    {
        label: 'Dashboard',
        path: FRONTEND_ROUTES.DASHBOARD,
        roles: [UserRole.ADMIN],
        icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    },
    {
        label: 'POS',
        path: FRONTEND_ROUTES.POS,
        roles: [UserRole.CASHIER, UserRole.ADMIN, UserRole.MANAGER],
        icon: <path d="M2 17h20M12 22V2M4 7h16" />
    },
    {
        label: 'Inventory',
        path: FRONTEND_ROUTES.INVENTORY,
        roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT],
        icon: <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    },
    {
        label: 'Ledger',
        path: FRONTEND_ROUTES.LEDGER,
        roles: [UserRole.ADMIN, UserRole.ACCOUNTANT],
        icon: <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
    },
    {
        label: 'Expenses',
        path: FRONTEND_ROUTES.EXPENSES,
        roles: [UserRole.ADMIN, UserRole.ACCOUNTANT],
        icon: <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    },
    {
        label: 'Users',
        path: FRONTEND_ROUTES.USER_MANAGEMENT,
        roles: [UserRole.ADMIN],
        icon: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    },
    {
        label: 'Branches',
        path: FRONTEND_ROUTES.BRANCHES,
        roles: [UserRole.ADMIN],
        icon: <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
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
        <div className="min-h-screen flex bg-[#0a0a0a] text-slate-200">
            {/* Sidebar */}
            <aside
                className={`${
                    sidebarOpen ? 'w-[260px]' : 'w-20'
                } transition-all duration-300 bg-[#111111] border-r border-white/10 flex flex-col`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                                <path d="M8 7h8" />
                                <path d="M8 11h8" />
                                <path d="M8 15h5" />
                            </svg>
                        </div>
                        {sidebarOpen && (
                            <h2 className="font-bold text-lg text-white tracking-tight">
                                LedgerPro
                            </h2>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                    {filteredNavItems.map((item) => {
                        // Mock active state. In a real app, check if current path matches item.path
                        const isActive = item.path === FRONTEND_ROUTES.DASHBOARD; 
                        
                        return (
                            <a
                                key={item.path}
                                href={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                                    isActive 
                                        ? 'bg-white text-slate-900 shadow-[0_4px_12px_rgba(255,255,255,0.1)]' 
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    {item.icon}
                                </svg>
                                {sidebarOpen && <span>{item.label}</span>}
                            </a>
                        )
                    })}
                </nav>

                {/* User info */}
                {user && (
                    <div className="p-4 border-t border-white/10">
                        <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
                            <div className="w-9 h-9 flex-shrink-0 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/20">
                                {user.firstName.charAt(0)}
                                {user.lastName.charAt(0)}
                            </div>
                            
                            {sidebarOpen && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        {user.firstName} {user.lastName}
                                    </p>
                                    <p className="text-[11px] text-slate-400 capitalize font-medium">
                                        {user.role}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header className="h-16 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between px-6 sticky top-0 z-10">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {sidebarOpen ? (
                                <path d="M19 12H5M12 19l-7-7 7-7" /> // Left arrow when open
                            ) : (
                                <path d="M3 12h18M3 6h18M3 18h18" /> // Hamburger when closed
                            )}
                        </svg>
                    </button>

                    <div className="flex items-center gap-2">
                        {/* Notifications bell */}
                        <button className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                            )}
                        </button>

                        <div className="w-px h-6 bg-white/10 mx-2" /> {/* Divider */}

                        {/* Logout */}
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}