import { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LuChevronRight as ChevronRight, LuLogOut as LogOut, LuMenu as MenuIcon, LuSearch as Search, LuUserCog as UserCog } from 'react-icons/lu';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { FRONTEND_ROUTES } from '@/constants/routes';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Avatar from '@/components/ui/Avatar';
import { ICON, CommandPalette } from '@/components/ui';
import { cn } from '@/lib/utils';
import { SidebarNav } from '@/layouts/components/SidebarNav';

export default function DashboardLayout() {
    const { t } = useTranslation('common');
    const { user, logout } = useAuth();
    const { unreadCount } = useNotifications();
    const [sidebarOpen, setSidebarOpen] = useState(
        () => localStorage.getItem('nav:sidebar-open') !== 'false',
    );
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const crumbs = useBreadcrumbs();

    // Remember the collapsed/expanded sidebar preference across sessions.
    useEffect(() => {
        localStorage.setItem('nav:sidebar-open', String(sidebarOpen));
    }, [sidebarOpen]);

    // ⌘K / Ctrl-K opens the command palette from anywhere.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setPaletteOpen(true);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

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
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-modal focus:px-3 focus:py-2 focus:rounded-md focus:bg-primary focus:text-text-inv focus:text-sm focus:font-medium focus:shadow-md-token focus:outline-none focus:ring-[3px] focus:ring-focus/25"
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
                    'bg-surface flex flex-shrink-0 z-40',
                    'fixed inset-y-0 left-0 w-[var(--nav-drawer-w)] transition-transform duration-200',
                    mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
                    'md:relative md:translate-x-0 md:transition-[width] md:w-auto',
                    sidebarOpen
                        ? 'md:w-[calc(var(--nav-rail-w)+var(--nav-panel-w))]'
                        : 'md:w-[var(--nav-rail-w)]',
                )}
            >
                <SidebarNav
                    collapsed={!sidebarOpen}
                    onToggleCollapsed={() => setSidebarOpen((s) => !s)}
                    unreadCount={unreadCount}
                    onNavigate={() => setMobileNavOpen(false)}
                />
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-14 border-b border-border bg-surface flex items-center px-4 gap-3 sticky top-0 z-20">
                    {/* Left: sidebar toggle + breadcrumbs (equal flex column). */}
                    <div className="flex flex-1 items-center gap-3 min-w-0">
                    <button
                        onClick={() => {
                            if (window.matchMedia('(max-width: 767px)').matches) {
                                setMobileNavOpen((m) => !m);
                            } else {
                                setSidebarOpen((s) => !s);
                            }
                        }}
                        className="p-2 text-text-2 hover:text-text-1 hover:bg-surface-2 rounded-md transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus/25"
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

                    {/* Breadcrumbs hide on mobile — keep a page-identity title. */}
                    {crumbs.length > 0 && (
                        <span className="md:hidden text-sm font-semibold text-text-1 truncate min-w-0">
                            {crumbs[crumbs.length - 1]}
                        </span>
                    )}
                    </div>

                    {/* Center: command-palette search, centered by equal side columns. */}
                    <button
                        type="button"
                        onClick={() => setPaletteOpen(true)}
                        aria-label={t('shell.commandPalette')}
                        aria-keyshortcuts="Meta+K Control+K"
                        className="hidden sm:flex items-center gap-2 h-10 w-[460px] max-w-full pl-3 pr-2 rounded-md border border-border bg-surface-2 text-text-3 hover:text-text-2 hover:border-border-strong transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus/25"
                    >
                        <Search size={ICON.md} aria-hidden />
                        <span className="text-sm">{t('shell.searchPlaceholder')}</span>
                        <kbd className="ml-auto text-[11px] font-medium text-text-3 bg-surface border border-border rounded px-1.5 py-0.5 leading-none">
                            ⌘K
                        </kbd>
                    </button>

                    {/* Right: mobile search + actions (equal flex column). */}
                    <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
                        <button
                            type="button"
                            onClick={() => setPaletteOpen(true)}
                            aria-label={t('shell.commandPalette')}
                            className="sm:hidden p-2 text-text-2 hover:text-text-1 hover:bg-surface-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus/25"
                        >
                            <Search size={18} aria-hidden />
                        </button>
                        <ThemeToggle />
                        <NotificationDropdown />
                        <div className="w-px h-6 bg-border" aria-hidden="true" />

                        {user && (
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setProfileOpen((s) => !s)}
                                    className="p-1 rounded-full hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus/25"
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

            <CommandPalette
                open={paletteOpen}
                onClose={() => setPaletteOpen(false)}
            />
        </div>
    );
}
