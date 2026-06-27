import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    LuLogOut as LogOut,
    LuUserRound as UserRound,
} from 'react-icons/lu';
import { useAuth } from '@/hooks/useAuth';
import { FRONTEND_ROUTES } from '@/constants/routes';
import Avatar from '@/components/ui/Avatar';

interface StorefrontUserMenuProps {
    /** Avatar image resolved by the layout (profile query → auth fallback). */
    avatarSrc?: string;
}

/**
 * Authenticated customer's avatar dropdown — Profile + Sign out. Owns its open
 * state, outside-click/Escape close, and roving-focus keyboard navigation.
 */
export function StorefrontUserMenu({ avatarSrc }: StorefrontUserMenuProps) {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menuOpen) return;
        const onMouse = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        const getMenuItems = () =>
            Array.from(
                menuRef.current?.querySelectorAll<HTMLElement>(
                    '[role="menuitem"]',
                ) ?? [],
            );
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setMenuOpen(false);
                return;
            }
            const items = getMenuItems();
            if (items.length === 0) return;
            const currentIdx = items.findIndex(
                (el) => el === document.activeElement,
            );
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const next = currentIdx < 0 ? 0 : (currentIdx + 1) % items.length;
                items[next]?.focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const next = currentIdx <= 0 ? items.length - 1 : currentIdx - 1;
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

    if (!user) return null;

    const handleLogout = () => {
        logout();
        setMenuOpen(false);
        navigate(FRONTEND_ROUTES.LOGIN);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                type="button"
                onClick={() => setMenuOpen((s) => !s)}
                className="p-1 rounded-full hover:bg-surface-2 transition-colors focus:outline-none focus:ring-[3px] focus:ring-focus/25"
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
                    className="absolute right-0 mt-2 w-52 bg-surface border border-border rounded-lg shadow-md-token overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 z-dropdown"
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
                        className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-text-1 hover:bg-surface-2 transition-colors focus:outline-none focus:bg-surface-2"
                        onClick={() => setMenuOpen(false)}
                    >
                        <UserRound size={14} /> Profile
                    </Link>
                    <button
                        role="menuitem"
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-danger hover:bg-danger-soft transition-colors focus:outline-none focus:bg-danger-soft"
                    >
                        <LogOut size={14} /> Sign out
                    </button>
                </div>
            )}
        </div>
    );
}
