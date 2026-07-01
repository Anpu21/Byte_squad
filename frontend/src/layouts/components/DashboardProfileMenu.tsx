import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LuLogOut as LogOut, LuUserCog as UserCog } from 'react-icons/lu';
import Avatar from '@/components/ui/Avatar';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';

/**
 * The dashboard header's user menu: avatar trigger + a keyboard-navigable
 * dropdown (arrow keys / Home / End, outside-click + Escape to close).
 */
export function DashboardProfileMenu() {
    const { user, logout } = useAuth();
    const { t } = useTranslation('common');
    const navigate = useNavigate();
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

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

    if (!user) return null;

    return (
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
    );
}
