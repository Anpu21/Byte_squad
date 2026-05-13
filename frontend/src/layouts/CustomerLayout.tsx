import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useQuery } from '@tanstack/react-query';
import {
    ChevronDown,
    LogOut,
    MapPin,
    Search,
    ScrollText,
    ShoppingCart,
    User,
    UserRound,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { toggleCartDrawer } from '@/store/slices/shopCartSlice';
import { selectShopCartItemCount } from '@/store/selectors/shopCart';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { queryKeys } from '@/lib/queryKeys';
import { profileService } from '@/services/profile.service';
import { CartDrawer } from '@/components/shop/CartDrawer';
import Logo from '@/components/ui/Logo';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Avatar from '@/components/ui/Avatar';

interface CustomerLayoutProps {
    children: ReactNode;
    /**
     * Skip the "select your pickup branch" redirect for routes that anyone
     * (anonymous or branch-less) should reach — e.g. public confirmation pages.
     */
    publicMode?: boolean;
}

export default function CustomerLayout({ children, publicMode = false }: CustomerLayoutProps) {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { user, isAuthenticated, logout } = useAuth();
    const cartCount = useAppSelector(selectShopCartItemCount);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const { data: profile } = useQuery({
        queryKey: queryKeys.profile.self(),
        queryFn: profileService.getProfile,
        enabled: isAuthenticated && user?.role === UserRole.CUSTOMER,
        staleTime: 60_000,
    });
    const branchName = profile?.branch?.name ?? null;
    const avatarSrc = profile?.avatarUrl ?? user?.avatarUrl ?? undefined;

    useEffect(() => {
        if (!menuOpen) return;
        const onMouse = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        const getMenuItems = () =>
            Array.from(
                menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ??
                    [],
            );
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setMenuOpen(false);
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
        requestAnimationFrame(() => getMenuItems()[0]?.focus());
        return () => {
            document.removeEventListener('mousedown', onMouse);
            document.removeEventListener('keydown', onKey);
        };
    }, [menuOpen]);

    const handleLogout = () => {
        logout();
        setMenuOpen(false);
        navigate(FRONTEND_ROUTES.LOGIN);
    };

    if (
        !publicMode &&
        isAuthenticated &&
        user?.role === UserRole.CUSTOMER &&
        !user.branchId
    ) {
        return <Navigate to={FRONTEND_ROUTES.SELECT_BRANCH} replace />;
    }

    return (
        <div className="min-h-screen bg-canvas text-text-1 font-sans flex flex-col">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-modal focus:px-3 focus:py-2 focus:rounded-md focus:bg-primary focus:text-text-inv focus:text-sm focus:font-medium focus:shadow-md-token focus:outline-none focus:ring-[3px] focus:ring-primary/30"
            >
                Skip to main content
            </a>
            <header className="sticky top-0 z-20 bg-surface border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
                    <Link to={FRONTEND_ROUTES.SHOP} className="flex-shrink-0">
                        <Logo />
                    </Link>

                    <button
                        type="button"
                        onClick={() => navigate(FRONTEND_ROUTES.SHOP_PROFILE)}
                        className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-soft text-primary-soft-text text-xs font-medium hover:opacity-90 transition-opacity max-w-[240px]"
                        title={
                            branchName
                                ? `Pickup at ${branchName} — open profile to change`
                                : 'Open profile to set your pickup branch'
                        }
                    >
                        <MapPin size={13} />
                        <span className="truncate">
                            {branchName ?? 'Select branch'}
                        </span>
                        <ChevronDown size={12} className="flex-shrink-0" />
                    </button>

                    <div className="hidden md:flex items-center flex-1 max-w-[420px] h-[36px] px-3 bg-surface-2 border border-border rounded-md gap-2">
                        <Search size={14} className="text-text-3 flex-shrink-0" />
                        <input
                            type="text"
                            placeholder="Search products…"
                            className="flex-1 bg-transparent outline-none text-[13px] text-text-1 placeholder:text-text-3 min-w-0"
                        />
                    </div>

                    <div className="flex items-center gap-1 ml-auto">
                        {isAuthenticated && user && (
                            <Link
                                to={FRONTEND_ROUTES.SHOP_MY_ORDERS}
                                className="hidden sm:inline-flex items-center gap-2 h-9 px-3 text-[13px] font-medium rounded-md bg-surface text-text-1 border border-border-strong hover:bg-surface-2 transition-colors"
                            >
                                <ScrollText size={14} />
                                <span>My Orders</span>
                            </Link>
                        )}

                        <ThemeToggle />

                        <button
                            type="button"
                            onClick={() => dispatch(toggleCartDrawer())}
                            className="relative p-2 text-text-2 hover:text-text-1 hover:bg-surface-2 rounded-md transition-colors"
                            aria-label="Open cart"
                        >
                            <ShoppingCart size={18} />
                            {cartCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center text-[10px] font-bold bg-primary text-text-inv rounded-full">
                                    {cartCount}
                                </span>
                            )}
                        </button>

                        {isAuthenticated && user ? (
                            <div className="relative" ref={menuRef}>
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen((s) => !s)}
                                    className="p-1 rounded-full hover:bg-surface-2 transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/20"
                                    aria-label="Open user menu"
                                    aria-haspopup="menu"
                                    aria-expanded={menuOpen}
                                >
                                    <Avatar
                                        name={`${user.firstName} ${user.lastName}`}
                                        src={avatarSrc}
                                        size={32}
                                    />
                                </button>
                                {menuOpen && (
                                    <div
                                        role="menu"
                                        aria-label="User menu"
                                        className="absolute right-0 mt-2 w-52 bg-surface border border-border rounded-md shadow-md-token overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 z-dropdown"
                                    >
                                        <div className="px-4 py-3 border-b border-border">
                                            <p className="text-[13px] font-semibold text-text-1 truncate">
                                                {user.firstName} {user.lastName}
                                            </p>
                                            <p className="text-[11px] text-text-2 truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                        <Link
                                            role="menuitem"
                                            to={FRONTEND_ROUTES.SHOP_PROFILE}
                                            className="flex items-center gap-2 px-4 py-2 text-[13px] text-text-1 hover:bg-surface-2 transition-colors focus:outline-none focus:bg-surface-2"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            <UserRound size={14} /> Profile
                                        </Link>
                                        <Link
                                            role="menuitem"
                                            to={FRONTEND_ROUTES.SHOP_MY_ORDERS}
                                            className="flex items-center gap-2 px-4 py-2 text-[13px] text-text-1 hover:bg-surface-2 transition-colors focus:outline-none focus:bg-surface-2"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            <ScrollText size={14} /> My Orders
                                        </Link>
                                        <button
                                            role="menuitem"
                                            type="button"
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-[13px] text-danger hover:bg-danger-soft transition-colors focus:outline-none focus:bg-danger-soft"
                                        >
                                            <LogOut size={14} /> Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                to={FRONTEND_ROUTES.LOGIN}
                                className="inline-flex items-center gap-2 h-9 px-3.5 text-[13px] font-medium rounded-md bg-primary text-text-inv hover:bg-primary-hover transition-colors"
                            >
                                <User size={14} /> Sign in
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
                {children}
            </main>

            <footer className="border-t border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-xs text-text-3">
                    LedgerPro Shop — pickup at your nearest branch.
                </div>
            </footer>

            <CartDrawer />
        </div>
    );
}
