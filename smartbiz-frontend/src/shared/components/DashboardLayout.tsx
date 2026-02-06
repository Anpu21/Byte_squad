import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { logout } from '@features/auth/slices/authSlice';
import { ROUTES } from '@shared/constants/routes';
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    BookMarked,
    ShoppingCart,
    Package,
    CreditCard,
    ClipboardList,
    BarChart3,
    Wallet,
    Clock,
    Scale,
    TrendingUp,
    Building2,
    LogOut,
    ChevronLeft,
    ChevronRight,
    User,
    LucideIcon,
} from 'lucide-react';
import './DashboardLayout.css';

interface MenuItem {
    icon: LucideIcon;
    label: string;
    path: string;
}

interface MenuSection {
    section: string;
    items: MenuItem[];
}

const menuItems: MenuSection[] = [
    {
        section: 'Main',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', path: ROUTES.ADMIN.DASHBOARD },
        ],
    },
    {
        section: 'Accounting',
        items: [
            { icon: BookOpen, label: 'Ledgers', path: ROUTES.ACCOUNTING.LEDGERS },
            { icon: FileText, label: 'Vouchers', path: ROUTES.ACCOUNTING.VOUCHERS },
            { icon: BookMarked, label: 'Day Book', path: ROUTES.ACCOUNTING.DAY_BOOK },
        ],
    },
    {
        section: 'Billing',
        items: [
            { icon: ShoppingCart, label: 'Sales', path: ROUTES.BILLING.SALES },
            { icon: Package, label: 'Purchase', path: ROUTES.BILLING.PURCHASE },
            { icon: CreditCard, label: 'POS', path: ROUTES.BILLING.POS },
        ],
    },
    {
        section: 'Inventory',
        items: [
            { icon: ClipboardList, label: 'Items', path: ROUTES.INVENTORY.ITEMS },
            { icon: BarChart3, label: 'Stock', path: ROUTES.INVENTORY.STOCK },
        ],
    },
    {
        section: 'Payments',
        items: [
            { icon: Wallet, label: 'Payments', path: ROUTES.PAYMENTS.LIST },
            { icon: Clock, label: 'Outstanding', path: ROUTES.PAYMENTS.OUTSTANDING },
        ],
    },
    {
        section: 'Reports',
        items: [
            { icon: Scale, label: 'Trial Balance', path: ROUTES.REPORTS.TRIAL_BALANCE },
            { icon: TrendingUp, label: 'Profit & Loss', path: ROUTES.REPORTS.PROFIT_LOSS },
            { icon: Building2, label: 'Balance Sheet', path: ROUTES.REPORTS.BALANCE_SHEET },
        ],
    },
];

const DashboardLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const handleLogout = async () => {
        await dispatch(logout());
        navigate(ROUTES.AUTH.LOGIN);
    };

    return (
        <div className={`dashboard-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Sidebar */}
            <aside className="dashboard-sidebar glassmorphism">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo__icon-wrapper">
                            <LayoutDashboard className="sidebar-logo__icon" size={24} />
                        </div>
                        {!isSidebarCollapsed && (
                            <span className="sidebar-logo__text">
                                Ledger<span className="gradient-text">Pro</span>
                            </span>
                        )}
                    </div>
                    <button
                        className="sidebar-toggle group"
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    >
                        {isSidebarCollapsed ? (
                            <ChevronRight className="transition-transform group-hover:translate-x-0.5" size={18} />
                        ) : (
                            <ChevronLeft className="transition-transform group-hover:-translate-x-0.5" size={18} />
                        )}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((section, sectionIndex) => (
                        <div
                            key={section.section}
                            className="sidebar-section"
                            style={{ animationDelay: `${sectionIndex * 50}ms` }}
                        >
                            {!isSidebarCollapsed && (
                                <h3 className="sidebar-section__title">{section.section}</h3>
                            )}
                            <ul className="sidebar-menu">
                                {section.items.map((item, itemIndex) => {
                                    const IconComponent = item.icon;
                                    return (
                                        <li
                                            key={item.path}
                                            style={{ animationDelay: `${(sectionIndex * 50) + (itemIndex * 30)}ms` }}
                                        >
                                            <Link
                                                to={item.path}
                                                className={`sidebar-menu__item ${location.pathname === item.path ? 'active' : ''}`}
                                                title={isSidebarCollapsed ? item.label : undefined}
                                            >
                                                <IconComponent className="sidebar-menu__icon" size={20} />
                                                {!isSidebarCollapsed && (
                                                    <span className="sidebar-menu__label">{item.label}</span>
                                                )}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button
                        className="sidebar-logout group"
                        onClick={handleLogout}
                        title="Logout"
                    >
                        <LogOut className="sidebar-menu__icon transition-transform group-hover:-translate-x-0.5" size={20} />
                        {!isSidebarCollapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="dashboard-main">
                <header className="dashboard-header glassmorphism">
                    <div className="header-left">
                        <h1 className="header-title">Dashboard</h1>
                    </div>
                    <div className="header-right">
                        <div className="header-user group">
                            <span className="header-user__avatar">
                                {user?.firstName?.charAt(0) || <User size={18} />}
                            </span>
                            <div className="header-user__info">
                                <span className="header-user__name">
                                    {user?.firstName} {user?.lastName}
                                </span>
                                <span className="header-user__role">{user?.role}</span>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="dashboard-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
