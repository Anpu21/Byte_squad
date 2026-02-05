import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { logout } from '@features/auth/slices/authSlice';
import { ROUTES } from '@shared/constants/routes';
import './DashboardLayout.css';

const menuItems = [
    {
        section: 'Main',
        items: [
            { icon: '📊', label: 'Dashboard', path: ROUTES.ADMIN.DASHBOARD },
        ],
    },
    {
        section: 'Accounting',
        items: [
            { icon: '📒', label: 'Ledgers', path: ROUTES.ACCOUNTING.LEDGERS },
            { icon: '📝', label: 'Vouchers', path: ROUTES.ACCOUNTING.VOUCHERS },
            { icon: '📖', label: 'Day Book', path: ROUTES.ACCOUNTING.DAY_BOOK },
        ],
    },
    {
        section: 'Billing',
        items: [
            { icon: '🛒', label: 'Sales', path: ROUTES.BILLING.SALES },
            { icon: '📦', label: 'Purchase', path: ROUTES.BILLING.PURCHASE },
            { icon: '💳', label: 'POS', path: ROUTES.BILLING.POS },
        ],
    },
    {
        section: 'Inventory',
        items: [
            { icon: '📋', label: 'Items', path: ROUTES.INVENTORY.ITEMS },
            { icon: '📊', label: 'Stock', path: ROUTES.INVENTORY.STOCK },
        ],
    },
    {
        section: 'Payments',
        items: [
            { icon: '💰', label: 'Payments', path: ROUTES.PAYMENTS.LIST },
            { icon: '⏳', label: 'Outstanding', path: ROUTES.PAYMENTS.OUTSTANDING },
        ],
    },
    {
        section: 'Reports',
        items: [
            { icon: '⚖️', label: 'Trial Balance', path: ROUTES.REPORTS.TRIAL_BALANCE },
            { icon: '📈', label: 'Profit & Loss', path: ROUTES.REPORTS.PROFIT_LOSS },
            { icon: '🏦', label: 'Balance Sheet', path: ROUTES.REPORTS.BALANCE_SHEET },
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
                        <span className="sidebar-logo__icon">📊</span>
                        {!isSidebarCollapsed && (
                            <span className="sidebar-logo__text">
                                Smart<span className="gradient-text">Biz</span>
                            </span>
                        )}
                    </div>
                    <button
                        className="sidebar-toggle"
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    >
                        {isSidebarCollapsed ? '▶' : '◀'}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((section) => (
                        <div key={section.section} className="sidebar-section">
                            {!isSidebarCollapsed && (
                                <h3 className="sidebar-section__title">{section.section}</h3>
                            )}
                            <ul className="sidebar-menu">
                                {section.items.map((item) => (
                                    <li key={item.path}>
                                        <Link
                                            to={item.path}
                                            className={`sidebar-menu__item ${location.pathname === item.path ? 'active' : ''
                                                }`}
                                            title={isSidebarCollapsed ? item.label : undefined}
                                        >
                                            <span className="sidebar-menu__icon">{item.icon}</span>
                                            {!isSidebarCollapsed && (
                                                <span className="sidebar-menu__label">{item.label}</span>
                                            )}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button
                        className="sidebar-logout"
                        onClick={handleLogout}
                        title="Logout"
                    >
                        <span className="sidebar-menu__icon">🚪</span>
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
                        <div className="header-user">
                            <span className="header-user__avatar">
                                {user?.firstName?.charAt(0) || 'U'}
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
