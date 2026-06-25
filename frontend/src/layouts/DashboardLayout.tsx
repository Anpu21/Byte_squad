import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LuChevronRight as ChevronRight, LuLogOut as LogOut, LuMenu as MenuIcon, LuUserCog as UserCog } from 'react-icons/lu';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { UserRole } from '@/constants/enums';
import {
    getSidebarSections,
    GROUP_LABEL_KEY,
    resolveNavPath,
} from '@/config/navigation';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Avatar from '@/components/ui/Avatar';
import Logo from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

export default function DashboardLayout() {
    const { t } = useTranslation('common');
    const { user, logout } = useAuth();
    const { unreadCount } = useNotifications();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const navigate = useNavigate();
    const crumbs = useBreadcrumbs();
    const isExpanded = sidebarOpen || mobileNavOpen;

    const { groups, items: sidebarItems } = getSidebarSections();
    const filteredNavItems = sidebarItems.filter((item) =>
        user ? item.roles.includes(user.role as UserRole) : false,
    );

    useEffect(() => {
        if (!profileOpen) return;
        const onMouse = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        };
        const getMenuItems = () =>
            Array.from(
                profileRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ??
                    [],
            );
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setProfileOpen(false);
                return;
            }
            const items = getMenuItems();
            if (items.length === 0) return;
            const currentIdx = items.findIndex((el) => el === document.activeElement);
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const next = currentIdx < 0 ? 0 : (currentIdx + 1) % items.length;
                items[next]?.focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const next =
                    currentIdx <= 0 ? items.length - 1 : currentIdx - 1;
                items[next]?.focus();
            } else if (e.key === 'Home') {
                e.preventDefault();
                items[0]?.focus();
            } else if (e.key === 'End') {
                e.preventDefault();
                items[items.length - 1]?.focus();
            }
        };
        document.addEventListener('mousedown', onMouse);
        document.addEventListener('keydown', onKey);
        // Auto-focus the first menu item when opened.
        requestAnimationFrame(() => getMenuItems()[0]?.focus());
        return () => {
            document.removeEventListener('mousedown', onMouse);
            document.removeEventListener('keydown', onKey);
        };
    }, [profileOpen]);

    const handleLogout = () => {
        setProfileOpen(false);
        logout();
    };

    return (
        <div className="h-screen flex bg-canvas text-text-1 font-sans overflow-hidden">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-modal focus:px-3 focus:py-2 focus:rounded-md focus:bg-primary focus:text-text-inv focus:text-sm focus:font-medium focus:shadow-md-token focus:outline-none focus:ring-[3px] focus:ring-primary/30"
            >
                {t('shell.skipToMain')}
            </a>
            {mobileNavOpen && (
                <div
                    className="md:hidden fixed inset-0 z-overlay"
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
                    {groups.map((group) => {
                        const items = filteredNavItems.filter((i) => i.group === group);
                        if (items.length === 0) return null;
                        return (
                            <div key={group} className="mb-2">
                                {isExpanded && (
                                    <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-text-3 px-3 pt-4 pb-1">
                                        {t(GROUP_LABEL_KEY[group])}
                                    </div>
                                )}
                                <div className="space-y-0.5">
                                    {items.map((item) => {
                                        const itemPath = resolveNavPath(item, user?.role);
                                        const isActive = location.pathname === itemPath;
                                        const Icon = item.Icon;
                                        return (
                                            <Link
                                                key={item.id}
                                                to={itemPath}
                                                title={!isExpanded ? t(item.label) : undefined}
                                                onClick={() => setMobileNavOpen(false)}
                                                className={cn(
                                                    'relative flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] transition-colors',
                                                    isActive
                                                        ? 'bg-surface-2 text-text-1 font-semibold'
                                                        : 'font-medium text-text-2 hover:bg-surface-2 hover:text-text-1',
                                                    !isExpanded && 'justify-center px-0',
                                                )}
                                            >
                                                {isActive && (
                                                    <span
                                                        className="absolute left-[-13px] top-1.5 bottom-1.5 w-[3px] bg-primary rounded-r"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                                <Icon
                                                    size={15}
                                                    aria-hidden
                                                    className={cn(
                                                        'flex-shrink-0',
                                                        isActive ? 'text-text-1' : 'text-text-3',
                                                    )}
                                                />
                                                {isExpanded && (
                                                    <>
                                                        <span className="flex-1 truncate">{t(item.label)}</span>
                                                        {itemPath === FRONTEND_ROUTES.NOTIFICATIONS &&
                                                            unreadCount > 0 && (
                                                                <span
                                                                    className="ml-auto text-[10px] font-bold bg-primary text-text-inv rounded-full min-w-[18px] h-[18px] inline-flex items-center justify-center px-1"
                                                                    aria-label={`${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`}
                                                                >
                                                                    {unreadCount > 99 ? '99+' : unreadCount}
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
                                        {user.role.toLowerCase()} · {t('shell.profile')}
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
                        aria-label={t('shell.toggleSidebar')}
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

                    <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
                        <ThemeToggle />
                        <NotificationDropdown />
                        <div className="w-px h-6 bg-border mx-1" />

                        {user && (
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setProfileOpen((s) => !s)}
                                    className="p-1 rounded-full hover:bg-surface-2 transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/20"
                                    aria-label={t('shell.openUserMenu')}
                                    aria-haspopup="menu"
                                    aria-expanded={profileOpen}
                                >
                                    <Avatar
                                        name={`${user.firstName} ${user.lastName}`}
                                        size={30}
                                    />
                                </button>
                                {profileOpen && (
                                    <div
                                        role="menu"
                                        aria-label="User menu"
                                        className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-md shadow-md-token overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 z-dropdown"
                                    >
                                        <div className="px-4 py-3 border-b border-border">
                                            <p className="text-[13px] font-semibold text-text-1 truncate">
                                                {user.firstName} {user.lastName}
                                            </p>
                                            <p className="text-[11px] text-text-2 truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                        <button
                                            role="menuitem"
                                            onClick={() => {
                                                setProfileOpen(false);
                                                navigate(FRONTEND_ROUTES.PROFILE);
                                            }}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-[13px] text-text-1 hover:bg-surface-2 transition-colors focus:outline-none focus:bg-surface-2"
                                        >
                                            <UserCog size={14} /> {t('shell.profile')}
                                        </button>
                                        <div className="h-px bg-border" role="separator" />
                                        <button
                                            role="menuitem"
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-[13px] text-danger hover:bg-danger-soft transition-colors focus:outline-none focus:bg-danger-soft"
                                        >
                                            <LogOut size={14} /> {t('shell.logout')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </header>

                <main id="main-content" className="flex-1 overflow-y-auto p-2 lg:p-4">
                    <div className="max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
