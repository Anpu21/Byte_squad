import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShoppingBag, ShoppingCart, User, LogOut, ScrollText } from 'lucide-react';
import type { ReactNode } from 'react';
import type { RootState } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import { selectCartItemCount } from '@/store/slices/shopCartSlice';
import { FRONTEND_ROUTES } from '@/constants/routes';

interface CustomerLayoutProps {
    children: ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    const cartItems = useSelector((state: RootState) => state.shopCart.items);
    const cartCount = selectCartItemCount(cartItems);
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        setMenuOpen(false);
        navigate(FRONTEND_ROUTES.LOGIN);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-slate-100">
            <header className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <Link
                        to={FRONTEND_ROUTES.SHOP}
                        className="flex items-center gap-2 text-white"
                    >
                        <ShoppingBag size={20} />
                        <span className="font-bold tracking-tight">LedgerPro Shop</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <Link
                            to={FRONTEND_ROUTES.SHOP_CART}
                            className="relative inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <ShoppingCart size={16} />
                            <span className="hidden sm:inline">Cart</span>
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center text-[10px] font-bold bg-emerald-500 text-black rounded-full">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {isAuthenticated && user ? (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen((s) => !s)}
                                    className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    <User size={16} />
                                    <span className="hidden sm:inline">
                                        {user.firstName}
                                    </span>
                                </button>
                                {menuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-[#111] border border-white/10 rounded-lg shadow-xl overflow-hidden">
                                        <Link
                                            to={FRONTEND_ROUTES.SHOP_MY_REQUESTS}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            <ScrollText size={14} /> My Requests
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                                        >
                                            <LogOut size={14} /> Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                to={FRONTEND_ROUTES.LOGIN}
                                className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-white text-black font-semibold hover:bg-slate-200 transition-colors"
                            >
                                Sign in
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>

            <footer className="border-t border-white/10 mt-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-xs text-slate-500">
                    LedgerPro Shop — pickup at your nearest branch.
                </div>
            </footer>
        </div>
    );
}
