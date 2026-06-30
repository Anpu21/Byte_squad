import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LuChevronRight as ChevronRight } from 'react-icons/lu';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { useActiveSection } from '@/hooks/useActiveSection';
import Avatar from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { SidebarRail } from './SidebarRail';
import { SidebarPanel } from './SidebarPanel';

interface SidebarNavProps {
    /** Desktop-collapsed (rail only). The panel still shows in the mobile drawer. */
    collapsed: boolean;
    /** Toggle the desktop collapse (rail-only ↔ rail+panel). */
    onToggleCollapsed?: () => void;
    unreadCount: number;
    onNavigate?: () => void;
}

/**
 * The two-tier sidebar dropped into DashboardLayout's `<aside>` (which owns the
 * width / collapse / drawer state): a group icon rail + the active group's
 * contextual panel + the profile footer. The active group is derived from the
 * route via `useActiveSection`.
 */
export function SidebarNav({
    collapsed,
    onToggleCollapsed,
    unreadCount,
    onNavigate,
}: SidebarNavProps) {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const location = useLocation();
    const { group, itemId } = useActiveSection();

    if (!user) return null;
    const role = user.role as UserRole;
    const onProfile = location.pathname === FRONTEND_ROUTES.PROFILE;

    return (
        <div className="flex h-full min-h-0 w-full">
            <SidebarRail
                role={role}
                activeGroup={group}
                collapsed={collapsed}
                onToggleCollapsed={onToggleCollapsed}
                onNavigate={onNavigate}
            />

            {group && (
                <div
                    className={cn(
                        'flex min-h-0 w-[var(--nav-panel-w)] flex-shrink-0 flex-col border-r border-border bg-surface',
                        collapsed && 'md:hidden',
                    )}
                >
                    <SidebarPanel
                        group={group}
                        activeItemId={itemId}
                        role={role}
                        unreadCount={unreadCount}
                        onNavigate={onNavigate}
                    />

                    <div className="border-t border-border p-3">
                        <Link
                            to={FRONTEND_ROUTES.PROFILE}
                            onClick={onNavigate}
                            aria-current={onProfile ? 'page' : undefined}
                            className={cn(
                                'flex items-center gap-2 rounded-md p-2 transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus/25',
                                onProfile ? 'bg-surface-2' : 'hover:bg-surface-2',
                            )}
                        >
                            <Avatar name={`${user.firstName} ${user.lastName}`} size={32} />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-semibold text-text-1">
                                    {user.firstName} {user.lastName}
                                </p>
                                <p className="truncate text-[11px] capitalize text-text-2">
                                    {user.role.toLowerCase()} · {t('shell.profile')}
                                </p>
                            </div>
                            <ChevronRight size={14} className="flex-shrink-0 text-text-3" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
