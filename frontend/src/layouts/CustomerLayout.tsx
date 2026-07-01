import { Link, Navigate, Outlet } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useQuery } from '@tanstack/react-query';
import { LuSearch as Search, LuShoppingCart as ShoppingCart, LuUser as User, LuX as X } from 'react-icons/lu';
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
import { StorefrontNav } from '@/layouts/components/StorefrontNav';
import { StorefrontUserMenu } from '@/layouts/components/StorefrontUserMenu';
import { ShopContextBanner } from '@/features/customer-groups/components/ShopContextBanner';
import { cn } from '@/lib/utils';
import { useStorefrontSearch } from './useStorefrontSearch';

interface CustomerLayoutProps {
    /**
     * Skip the "select your pickup branch" redirect for routes that anyone
     * (anonymous or branch-less) should reach — e.g. public confirmation pages.
     */
    publicMode?: boolean;
}

export default function CustomerLayout({
    publicMode = false,
}: CustomerLayoutProps) {
    const dispatch = useAppDispatch();
    const { user, isAuthenticated } = useAuth();
    const cartCount = useAppSelector(selectShopCartItemCount);
    const { searchDraft, setSearchDraft, handleSearchSubmit, handleSearchClear } =
        useStorefrontSearch();

    const { data: profile } = useQuery({
        queryKey: queryKeys.profile.self(),
        queryFn: profileService.getProfile,
        enabled: isAuthenticated && user?.role === UserRole.CUSTOMER,
        staleTime: 60_000,
    });
    const avatarSrc = profile?.avatarUrl ?? user?.avatarUrl ?? undefined;

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

            <header className="sticky top-0 z-sticky bg-surface/90 backdrop-blur-md border-b border-border">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-3 sm:gap-4">
                    <div className="flex flex-1 items-center min-w-0">
                        <Link
                            to={FRONTEND_ROUTES.SHOP}
                            className="flex items-center gap-2.5 flex-shrink-0"
                            aria-label="Ledger Pro — shop home"
                        >
                            <Logo size={38} label={false} />
                            <span className="hidden sm:flex flex-col leading-tight">
                                <span className="text-[15px] font-bold tracking-[-0.01em] text-text-1">
                                    Ledger Pro
                                </span>
                                <span className="text-[11px] font-medium text-text-3">
                                    Pickup &amp; rewards
                                </span>
                            </span>
                        </Link>
                    </div>

                    <form
                        role="search"
                        onSubmit={handleSearchSubmit}
                        className="hidden lg:flex items-center flex-none w-[420px] max-w-full h-[38px] px-3 bg-surface-2 border border-border-strong rounded-[var(--radius-field)] gap-2 focus-within:border-focus focus-within:ring-[3px] focus-within:ring-focus/25 transition-[border-color,box-shadow] duration-150 ease-out"
                    >
                        <Search size={15} className="text-text-3 flex-shrink-0" />
                        <input
                            type="text"
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            placeholder="Search products, orders or codes"
                            aria-label="Search products"
                            className="flex-1 bg-transparent outline-none text-[13px] text-text-1 placeholder:text-text-3 min-w-0"
                        />
                        {searchDraft && (
                            <button
                                type="button"
                                onClick={handleSearchClear}
                                aria-label="Clear search"
                                className="p-0.5 rounded-sm text-text-3 hover:text-text-1 transition-colors focus:outline-none focus:ring-[2px] focus:ring-focus/30"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </form>

                    <div className="flex flex-1 items-center justify-end gap-1.5 min-w-0">
                        {!publicMode && (
                            <StorefrontNav
                                variant="pills"
                                className="hidden md:flex mr-1"
                            />
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
                            <StorefrontUserMenu avatarSrc={avatarSrc} />
                        ) : (
                            <Link
                                to={FRONTEND_ROUTES.LOGIN}
                                className="inline-flex items-center gap-2 h-9 px-3.5 text-[13px] font-medium rounded-md bg-primary text-text-inv hover:bg-primary-hover transition-colors"
                            >
                                <User size={14} />{' '}
                                <span className="hidden sm:inline">Sign in</span>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {!publicMode && <ShopContextBanner />}

            <main
                id="main-content"
                className={cn(
                    'flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-8',
                    !publicMode && 'pb-24 md:pb-8',
                )}
            >
                <Outlet />
            </main>

            <footer className="border-t border-border">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 text-xs text-text-3">
                    LedgerPro Shop — pickup at your nearest branch.
                </div>
            </footer>

            {!publicMode && (
                <StorefrontNav variant="bottom" className="md:hidden" />
            )}

            <CartDrawer />
        </div>
    );
}
