import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LuChevronRight as ChevronRight } from 'react-icons/lu';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { useActiveSection } from '@/hooks/useActiveSection';
import { useSidebarBadges } from '@/hooks/useSidebarBadges';
import { type NavGroup } from '@/config/navigation';
import Avatar from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { SidebarRail } from './SidebarRail';
import { SidebarPanel } from './SidebarPanel';

const EXPANDED_KEY = 'nav:expanded';

function readExpanded(): Set<string> {
    try {
        const raw = localStorage.getItem(EXPANDED_KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        return new Set(
            Array.isArray(parsed)
                ? parsed.filter((x): x is string => typeof x === 'string')
                : [],
        );
    } catch {
        return new Set();
    }
}

function writeExpanded(ids: Set<string>): void {
    try {
        localStorage.setItem(EXPANDED_KEY, JSON.stringify([...ids]));
    } catch {
        // localStorage unavailable / quota — non-fatal.
    }
}

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
 * contextual panel + the profile footer. When collapsed, hovering a rail group
 * pops its panel out as a floating flyout. Expand state is held here so the panel
 * and the flyout share one source of truth (and one localStorage writer).
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
    const badges = useSidebarBadges(user?.role as UserRole | undefined);

    // Shared expand state for the panel + the collapsed flyout (single persister).
    const [expanded, setExpanded] = useState<Set<string>>(readExpanded);
    useEffect(() => {
        writeExpanded(expanded);
    }, [expanded]);
    // The active section is always shown expanded; explicit toggles persist for the rest.
    const effectiveExpanded = useMemo(
        () => (itemId ? new Set(expanded).add(itemId) : expanded),
        [expanded, itemId],
    );
    const toggleSection = useCallback((id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    // Hover flyout (collapsed only): a floating copy of the panel for a group.
    const [flyout, setFlyout] = useState<{ group: NavGroup; top: number } | null>(
        null,
    );
    const hideTimer = useRef<number | undefined>(undefined);
    const cancelHide = useCallback(() => window.clearTimeout(hideTimer.current), []);
    const scheduleHide = useCallback(() => {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = window.setTimeout(() => setFlyout(null), 140);
    }, []);
    const handleHoverGroup = useCallback(
        (next: { group: NavGroup; top: number } | null) => {
            if (!next) {
                scheduleHide();
                return;
            }
            cancelHide();
            setFlyout(next);
        },
        [cancelHide, scheduleHide],
    );
    useEffect(() => () => window.clearTimeout(hideTimer.current), []);
    // Collapsing/expanding the rail dismisses any open flyout (the only runtime
    // mutator of `collapsed`, so clearing it here covers every transition).
    const handleToggleCollapsed = useCallback(() => {
        setFlyout(null);
        onToggleCollapsed?.();
    }, [onToggleCollapsed]);

    if (!user) return null;
    const role = user.role as UserRole;
    const onProfile = location.pathname === FRONTEND_ROUTES.PROFILE;

    return (
        <div className="flex h-full min-h-0 w-full">
            <SidebarRail
                role={role}
                activeGroup={group}
                collapsed={collapsed}
                onToggleCollapsed={handleToggleCollapsed}
                onHoverGroup={handleHoverGroup}
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
                        expanded={effectiveExpanded}
                        onToggleSection={toggleSection}
                        badges={badges}
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

            {collapsed &&
                flyout &&
                createPortal(
                    <div
                        className="fixed z-dropdown"
                        style={{ top: flyout.top, left: 'calc(var(--nav-rail-w) + 6px)' }}
                        onMouseEnter={cancelHide}
                        onMouseLeave={scheduleHide}
                    >
                        <div className="flex max-h-[80vh] w-[var(--nav-panel-w)] flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-lg-token animate-in fade-in slide-in-from-left-1 duration-100">
                            <SidebarPanel
                                group={flyout.group}
                                activeItemId={itemId}
                                role={role}
                                unreadCount={unreadCount}
                                expanded={effectiveExpanded}
                                onToggleSection={toggleSection}
                                badges={badges}
                                onNavigate={() => {
                                    setFlyout(null);
                                    onNavigate?.();
                                }}
                            />
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
