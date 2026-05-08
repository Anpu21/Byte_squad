import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Bell,
    Boxes,
    Building2,
    ChevronRight,
    GitCompareArrows,
    Home,
    LogOut,
    Menu as MenuIcon,
    PiggyBank,
    Receipt,
    ScanLine,
    ScrollText,
    Search,
    ShoppingCart,
    Truck,
    UserCog,
    Users,
    Wallet,
    History,
    Store,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { UserRole } from '@/constants/enums';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Avatar from '@/components/ui/Avatar';
import Logo from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
    children: ReactNode;
}

type NavGroup =
    | 'Operations'
    | 'Inventory'
    | 'Accounting'
    | 'People'
    | 'Branches'
    | 'System';

interface NavItem {
    label: string;
    path: string;
    roles: UserRole[];
    icon: ReactNode;
    group: NavGroup;
}

const NAV_ITEMS: NavItem[] = [
    {
        label: 'Dashboard',
        path: FRONTEND_ROUTES.DASHBOARD,
        roles: [UserRole.ADMIN, UserRole.MANAGER],
        icon: <Home size={15} />,
        group: 'Operations',
    },
    {
        label: 'Dashboard',
        path: FRONTEND_ROUTES.CASHIER_DASHBOARD,
        roles: [UserRole.CASHIER],
        icon: <Home size={15} />,
        group: 'Operations',
    },
    {
        label: 'POS',
        path: FRONTEND_ROUTES.POS,
        roles: [UserRole.CASHIER],
        icon: <Receipt size={15} />,
        group: 'Operations',
    },
    {
        label: 'Transactions',
        path: FRONTEND_ROUTES.TRANSACTIONS,
        roles: [UserRole.CASHIER, UserRole.ADMIN, UserRole.MANAGER],
        icon: <ScrollText size={15} />,
        group: 'Operations',
    },
    {
        label: 'Scan Pickup',
        path: FRONTEND_ROUTES.SCAN_REQUEST,
        roles: [UserRole.CASHIER],
        icon: <ScanLine size={15} />,
        group: 'Operations',
    },
    {
        label: 'Customer Requests',
        path: FRONTEND_ROUTES.CUSTOMER_REQUESTS,
        roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER],
        icon: <ShoppingCart size={15} />,
        group: 'People',
    },
    {
        label: 'Inventory',
        path: FRONTEND_ROUTES.INVENTORY,
        roles: [UserRole.ADMIN, UserRole.MANAGER],
        icon: <Boxes size={15} />,
        group: 'Inventory',
    },
    {
        label: 'Ledger',
        path: FRONTEND_ROUTES.LEDGER,
        roles: [UserRole.ADMIN],
        icon: <ScrollText size={15} />,
        group: 'Accounting',
    },
    {
        label: 'Expenses',
        path: FRONTEND_ROUTES.EXPENSES,
        roles: [UserRole.ADMIN, UserRole.MANAGER],
        icon: <Wallet size={15} />,
        group: 'Accounting',
    },
    {
        label: 'Profit & Loss',
        path: FRONTEND_ROUTES.PROFIT_LOSS,
        roles: [UserRole.ADMIN],
        icon: <PiggyBank size={15} />,
        group: 'Accounting',
    },
    {
        label: 'Users',
        path: FRONTEND_ROUTES.USER_MANAGEMENT,
        roles: [UserRole.ADMIN],
        icon: <Users size={15} />,
        group: 'People',
    },
    {
        label: 'Transfers',
        path: FRONTEND_ROUTES.TRANSFERS,
        roles: [UserRole.MANAGER],
        icon: <Truck size={15} />,
        group: 'Inventory',
    },
    {
        label: 'Transfer History',
        path: FRONTEND_ROUTES.TRANSFER_HISTORY,
        roles: [UserRole.MANAGER],
        icon: <History size={15} />,
        group: 'Inventory',
    },
    {
        label: 'My Branch',
        path: FRONTEND_ROUTES.BRANCHES,
        roles: [UserRole.MANAGER],
        icon: <Store size={15} />,
        group: 'Branches',
    },
    {
        label: 'Branches',
        path: FRONTEND_ROUTES.BRANCHES_HUB,
        roles: [UserRole.ADMIN],
        icon: <Building2 size={15} />,
        group: 'Branches',
    },
    {
        label: 'Compare',
        path: FRONTEND_ROUTES.BRANCH_COMPARE,
        roles: [UserRole.ADMIN],
        icon: <GitCompareArrows size={15} />,
        group: 'Branches',
    },
    {
        label: 'Transfers',
        path: FRONTEND_ROUTES.ADMIN_TRANSFERS,
        roles: [UserRole.ADMIN],
        icon: <Truck size={15} />,
        group: 'Inventory',
    },
    {
        label: 'Transfer History',
        path: FRONTEND_ROUTES.TRANSFER_HISTORY,
        roles: [UserRole.ADMIN],
        icon: <History size={15} />,
        group: 'Inventory',
    },
    {
        label: 'Notifications',
        path: FRONTEND_ROUTES.NOTIFICATIONS,
        roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER],
        icon: <Bell size={15} />,
        group: 'System',
    },
];

const GROUP_ORDER: NavGroup[] = [
    'Operations',
    'Inventory',
    'Accounting',
    'People',
    'Branches',
    'System',
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { user, logout } = useAuth();
    const { unreadCount } = useNotifications();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const location = useLocation();
    const navigate = useNavigate();
    const crumbs = useBreadcrumbs();
    const isExpanded = sidebarOpen || mobileNavOpen;

    const filteredNavItems = NAV_ITEMS.filter((item) =>
        user ? item.roles.includes(user.role as UserRole) : false,
    );

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    useEffect(() => {
        if (!profileOpen) return;
        const handler = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [profileOpen]);

    const handleLogout = () => {
        setProfileOpen(false);
        logout();
    };

    return (
        <div className="min-h-screen flex bg-canvas text-text-1 font-sans">
            {mobileNavOpen && (
                <div
                    className="md:hidden fixed inset-0 z-30"
                    style={{ background: 'var(--overlay)' }}
                    onClick={() => setMobileNavOpen(false)}
                    aria-hidden="true"
                />
            )}
            <aside
                className={cn(
                    'bg-surface border-r border-border flex flex-col flex-shrink-0 z-40',
                    'fixed inset-y-0 left-0 w-[280px] transition-transform duration-200',
                    mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
                    'md:relative md:translate-x-0 md:transition-[width] md:w-auto',
                    sidebarOpen ? 'md:w-[240px]' : 'md:w-[68px]',
                )}
            >
                <div className="h-16 flex items-center px-4 border-b border-border">
                    {isExpanded ? (
                        <Logo size={28} />
                    ) : (
                        <Logo size={28} label={false} />
                    )}
                </div>

                <nav className="flex-1 px-3 py-3 overflow-y-auto">
                    {GROUP_ORDER.map((group) => {
                        const items = filteredNavItems.filter((i) => i.group === group);
                        if (items.length === 0) return null;
                        return (
                            <div key={group} className="mb-2">
                                {isExpanded && (
                                    <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-text-3 px-3 pt-3 pb-1.5">
                                        {group}
                                    </div>
                                )}
                                <div className="space-y-0.5">
                                    {items.map((item) => {
                                        const isActive = location.pathname === item.path;
                                        return (
                                            <Link
                                                key={`${item.path}-${item.label}`}
                                                to={item.path}
                                                title={!isExpanded ? item.label : undefined}
                                                onClick={() => setMobileNavOpen(false)}
                                                className={cn(
                                                    'relative flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors',
                                                    isActive
                                                        ? 'bg-primary-soft text-primary-soft-text'
                                                        : 'text-text-2 hover:bg-surface-2 hover:text-text-1',
                                                    !isExpanded && 'justify-center px-0',
                                                )}
                                            >
                                                {isActive && (
                                                    <span
                                                        className="absolute left-[-13px] top-2 bottom-2 w-[3px] bg-primary rounded-r"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                                <span className="flex-shrink-0">{item.icon}</span>
                                                {isExpanded && (
                                                    <>
                                                        <span className="flex-1 truncate">{item.label}</span>
                                                        {item.path === FRONTEND_ROUTES.NOTIFICATIONS &&
                                                            unreadCount > 0 && (
                                                                <span className="ml-auto text-[10px] font-bold bg-primary text-text-inv rounded-full min-w-[18px] h-[18px] inline-flex items-center justify-center px-1">
                                                                    {unreadCount}
                                                                </span>
                                                            )}
                                                    </>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {user && (
                    <div className="p-3 border-t border-border">
                        <Link
                            to={FRONTEND_ROUTES.PROFILE}
                            onClick={() => setMobileNavOpen(false)}
                            className={cn(
                                'flex items-center gap-2 p-2 rounded-md transition-colors',
                                location.pathname === FRONTEND_ROUTES.PROFILE
                                    ? 'bg-surface-2'
                                    : 'hover:bg-surface-2',
                                !isExpanded && 'justify-center',
                            )}
                        >
                            <Avatar
                                name={`${user.firstName} ${user.lastName}`}
                                size={32}
                            />
                            {isExpanded && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-semibold text-text-1 truncate">
                                        {user.firstName} {user.lastName}
                                    </p>
                                    <p className="text-[11px] text-text-2 capitalize truncate">
                                        {user.role.toLowerCase()} · Profile
                                    </p>
                                </div>
                            )}
                            {isExpanded && (
                                <ChevronRight size={14} className="text-text-3" />
                            )}
                        </Link>
                    </div>
                )}
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-14 border-b border-border bg-surface flex items-center px-4 gap-3 sticky top-0 z-20">
                    <button
                        onClick={() => {
                            if (window.matchMedia('(max-width: 767px)').matches) {
                                setMobileNavOpen((m) => !m);
                            } else {
                                setSidebarOpen((s) => !s);
                            }
                        }}
                        className="p-1.5 text-text-2 hover:text-text-1 hover:bg-surface-2 rounded-md transition-colors flex-shrink-0"
                        aria-label="Toggle sidebar"
                    >
                        <MenuIcon size={18} />
                    </button>

                    {crumbs.length > 0 && (
                        <nav
                            className="hidden md:flex items-center gap-1.5 min-w-0"
                            aria-label="Breadcrumb"
                        >
                            {crumbs.map((c, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    {i > 0 && (
                                        <ChevronRight size={12} className="text-text-3" />
                                    )}
                                    <span
                                        className={cn(
                                            'text-[13px] truncate',
                                            i === crumbs.length - 1
                                                ? 'text-text-1 font-semibold'
                                                : 'text-text-2',
                                        )}
                                    >
                                        {c}
                                    </span>
                                </div>
                            ))}
                        </nav>
                    )}

                    <div className="flex-1 flex justify-end">
                        <div className="hidden lg:flex items-center w-full max-w-[360px] h-[34px] px-3 bg-surface-2 border border-border rounded-md gap-2">
                            <Search size={14} className="text-text-3 flex-shrink-0" />
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="Search products, transactions, customers…"
                                className="flex-1 bg-transparent outline-none text-[13px] text-text-1 placeholder:text-text-3 min-w-0"
                            />
                            <span className="mono text-[10px] text-text-3 px-1.5 py-0.5 bg-surface border border-border rounded">
                                ⌘K
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                        <ThemeToggle />
                        <NotificationDropdown />
                        <div className="w-px h-6 bg-border mx-1" />

                        {user && (
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setProfileOpen((s) => !s)}
                                    className="p-1 rounded-full hover:bg-surface-2 transition-colors"
                                    aria-label="Open user menu"
                                >
                                    <Avatar
                                        name={`${user.firstName} ${user.lastName}`}
                                        size={30}
                                    />
                                </button>
                                {profileOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-md shadow-md-token overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                        <div className="px-4 py-3 border-b border-border">
                                            <p className="text-[13px] font-semibold text-text-1 truncate">
                                                {user.firstName} {user.lastName}
                                            </p>
                                            <p className="text-[11px] text-text-2 truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setProfileOpen(false);
                                                navigate(FRONTEND_ROUTES.PROFILE);
                                            }}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-[13px] text-text-1 hover:bg-surface-2 transition-colors"
                                        >
                                            <UserCog size={14} /> Profile
                                        </button>
                                        <div className="h-px bg-border" />
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-[13px] text-danger hover:bg-danger-soft transition-colors"
                                        >
                                            <LogOut size={14} /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">{children}</div>
                </main>
            </div>
        </div>
    );
}
