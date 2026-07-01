import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LuChevronRight as ChevronRight, LuMenu as MenuIcon, LuSearch as Search } from 'react-icons/lu';
import { useNotifications } from '@/hooks/useNotifications';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { ICON, CommandPalette } from '@/components/ui';
import { cn } from '@/lib/utils';
import { SidebarNav } from '@/layouts/components/SidebarNav';
import { DashboardProfileMenu } from '@/layouts/components/DashboardProfileMenu';

export default function DashboardLayout() {
    const { t } = useTranslation('common');
    const { unreadCount } = useNotifications();
    const [sidebarOpen, setSidebarOpen] = useState(
        () => localStorage.getItem('nav:sidebar-open') !== 'false',
    );
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);
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

                        <DashboardProfileMenu />
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
