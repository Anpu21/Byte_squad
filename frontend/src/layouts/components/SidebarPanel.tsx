import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LuChevronDown as ChevronDown } from 'react-icons/lu';
import { UserRole } from '@/constants/enums';
import {
    GROUP_LABEL_KEY,
    getGroupItems,
    resolveNavPath,
    type NavGroup,
} from '@/config/navigation';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { NAV_ICON } from '@/components/ui';
import { cn } from '@/lib/utils';
import { SidebarPanelTabs } from './SidebarPanelTabs';

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

interface SidebarPanelProps {
    group: NavGroup;
    activeItemId: string | null;
    role: UserRole;
    unreadCount: number;
    onNavigate?: () => void;
}

/**
 * The contextual secondary panel of the two-tier sidebar — the active group's
 * role-filtered items as a vertical list, headed by the group label. Items that
 * are tabbed workspaces carry a chevron to expand/collapse their sub-tabs
 * (rendered by {@link SidebarPanelTabs}); the active item auto-expands.
 */
export function SidebarPanel({
    group,
    activeItemId,
    role,
    unreadCount,
    onNavigate,
}: SidebarPanelProps) {
    const { t } = useTranslation('common');
    const items = getGroupItems(group, role);
    const [expanded, setExpanded] = useState<Set<string>>(() => {
        const stored = readExpanded();
        if (activeItemId) stored.add(activeItemId);
        return stored;
    });

    // Auto-expand the active tabbed item as the route changes (without collapsing
    // anything the user opened manually).
    useEffect(() => {
        if (!activeItemId) return;
        setExpanded((prev) =>
            prev.has(activeItemId) ? prev : new Set(prev).add(activeItemId),
        );
    }, [activeItemId]);

    // Remember which sections are open across reloads.
    useEffect(() => {
        writeExpanded(expanded);
    }, [expanded]);

    const toggle = (id: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    return (
        <nav
            aria-label={t('shell.secondaryNav')}
            className="flex-1 overflow-y-auto px-3 py-4"
        >
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
                {t(GROUP_LABEL_KEY[group])}
            </p>
            <ul className="flex flex-col gap-0.5">
                {items.map((item) => {
                    const itemPath = resolveNavPath(item, role);
                    const active = item.id === activeItemId;
                    const Icon = item.Icon;
                    const hasTabs = Boolean(item.tabs?.length);
                    const isOpen = hasTabs && expanded.has(item.id);
                    const showBadge =
                        itemPath === FRONTEND_ROUTES.NOTIFICATIONS && unreadCount > 0;
                    const subId = `subnav-${item.id}`;
                    return (
                        <li key={item.id}>
                            <div
                                className={cn(
                                    'group flex items-center rounded-md transition-colors',
                                    active ? 'bg-surface-2' : 'hover:bg-surface-2',
                                )}
                            >
                                <Link
                                    to={itemPath}
                                    onClick={onNavigate}
                                    aria-current={active ? 'page' : undefined}
                                    className="flex h-[var(--nav-row-h)] min-w-0 flex-1 items-center gap-2.5 rounded-md px-3 text-[length:var(--nav-label-size)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus/25"
                                >
                                    <Icon
                                        size={NAV_ICON}
                                        strokeWidth={2}
                                        aria-hidden
                                        className={cn(
                                            'flex-shrink-0 transition-colors',
                                            active
                                                ? 'text-primary'
                                                : 'text-text-3 group-hover:text-text-2',
                                        )}
                                    />
                                    <span
                                        className={cn(
                                            'flex-1 truncate',
                                            active
                                                ? 'font-semibold text-text-1'
                                                : 'font-medium text-text-2',
                                        )}
                                    >
                                        {t(item.label)}
                                    </span>
                                    {showBadge && (
                                        <span
                                            className="inline-flex h-[var(--nav-badge-size)] min-w-[var(--nav-badge-size)] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-text-inv"
                                            aria-label={`${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`}
                                        >
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                </Link>
                                {hasTabs && (
                                    <button
                                        type="button"
                                        onClick={() => toggle(item.id)}
                                        aria-expanded={isOpen}
                                        aria-controls={subId}
                                        aria-label={t(
                                            isOpen
                                                ? 'shell.collapseSection'
                                                : 'shell.expandSection',
                                        )}
                                        className="mr-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-text-3 transition-colors hover:text-text-1 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus/25"
                                    >
                                        <ChevronDown
                                            size={14}
                                            className={cn(
                                                'transition-transform',
                                                isOpen && 'rotate-180',
                                            )}
                                        />
                                    </button>
                                )}
                            </div>
                            {isOpen && (
                                <SidebarPanelTabs
                                    id={subId}
                                    entry={item}
                                    role={role}
                                    isActive={active}
                                    onNavigate={onNavigate}
                                />
                            )}
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
