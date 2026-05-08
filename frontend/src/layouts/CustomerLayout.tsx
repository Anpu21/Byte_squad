import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
import type { RootState } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import {
    selectCartItemCount,
    toggleCartDrawer,
} from '@/store/slices/shopCartSlice';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { profileService } from '@/services/profile.service';
import CartDrawer from '@/components/shop/CartDrawer';
import Logo from '@/components/ui/Logo';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Avatar from '@/components/ui/Avatar';

interface CustomerLayoutProps {
    children: ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, isAuthenticated, logout } = useAuth();
    const cartItems = useSelector((state: RootState) => state.shopCart.items);
    const cartCount = selectCartItemCount(cartItems);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const { data: profile } = useQuery({
        queryKey: ['profile'],
        queryFn: profileService.getProfile,
        enabled: isAuthenticated && user?.role === UserRole.CUSTOMER,
        staleTime: 60_000,
    });
    const branchName = profile?.branch?.name ?? null;
    const avatarSrc = profile?.avatarUrl ?? user?.avatarUrl ?? undefined;

    useEffect(() => {
        if (!menuOpen) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menuOpen]);

    const handleLogout = () => {
        logout();
        setMenuOpen(false);
        navigate(FRONTEND_ROUTES.LOGIN);
    };

    if (
        isAuthenticated &&
        user?.role === UserRole.CUSTOMER &&
        !user.branchId
    ) {
        return <Navigate to={FRONTEND_ROUTES.SELECT_BRANCH} replace />;
    }

    return (
        <div className="min-h-screen bg-canvas text-text-1 font-sans flex flex-col">
            <header className="sticky top-0 z-20 bg-surface border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
                    <Link to={FRONTEND_ROUTES.SHOP} className="flex-shrink-0">
                        <Logo />
                    </Link>

                    <button
                        type="button"
                        onClick={() => navigate(FRONTEND_ROUTES.SELECT_BRANCH)}
                        className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-soft text-primary-soft-text text-xs font-medium hover:opacity-90 transition-opacity max-w-[240px]"
                        title={
                            branchName
                                ? `Pickup at ${branchName} — click to change`
                                : 'Select your pickup branch'
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
                                to={FRONTEND_ROUTES.SHOP_MY_REQUESTS}
                                className="hidden sm:inline-flex items-center gap-2 h-9 px-3 text-[13px] font-medium rounded-md bg-surface text-text-1 border border-border-strong hover:bg-surface-2 transition-colors"
                            >
                                <ScrollText size={14} />
                                <span>My Requests</span>
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
                                    className="p-1 rounded-full hover:bg-surface-2 transition-colors"
                                    aria-label="Open user menu"
                                >
                                    <Avatar
                                        name={`${user.firstName} ${user.lastName}`}
                                        src={avatarSrc}
                                        size={32}
                                    />
                                </button>
                                {menuOpen && (
                                    <div className="absolute right-0 mt-2 w-52 bg-surface border border-border rounded-md shadow-md-token overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                        <div className="px-4 py-3 border-b border-border">
                                            <p className="text-[13px] font-semibold text-text-1 truncate">
                                                {user.firstName} {user.lastName}
                                            </p>
                                            <p className="text-[11px] text-text-2 truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                        <Link
                                            to={FRONTEND_ROUTES.SHOP_PROFILE}
                                            className="flex items-center gap-2 px-4 py-2 text-[13px] text-text-1 hover:bg-surface-2 transition-colors"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            <UserRound size={14} /> Profile
                                        </Link>
                                        <Link
                                            to={FRONTEND_ROUTES.SHOP_MY_REQUESTS}
                                            className="flex items-center gap-2 px-4 py-2 text-[13px] text-text-1 hover:bg-surface-2 transition-colors"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            <ScrollText size={14} /> My Requests
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-[13px] text-danger hover:bg-danger-soft transition-colors"
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

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
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
