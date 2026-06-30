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

interface SidebarPanelProps {
    group: NavGroup;
    activeItemId: string | null;
    role: UserRole;
    unreadCount: number;
    /** Ids of tabbed items whose sub-tabs are expanded — shared by panel + flyout. */
    expanded: Set<string>;
    onToggleSection: (id: string) => void;
    /** Per-item live counts (sidebar item id → count); rendered as a pill. */
    badges?: Record<string, number>;
    onNavigate?: () => void;
}

/**
 * The contextual secondary panel of the two-tier sidebar — the active group's
 * role-filtered items as a vertical list, headed by the group label. Items that
 * are tabbed workspaces carry a chevron to expand/collapse their sub-tabs
 * ({@link SidebarPanelTabs}). Expand state is owned by the parent so the panel and
 * the collapsed-rail flyout stay in sync.
 */
export function SidebarPanel({
    group,
    activeItemId,
    role,
    unreadCount,
    expanded,
    onToggleSection,
    badges,
    onNavigate,
}: SidebarPanelProps) {
    const { t } = useTranslation('common');
    const items = getGroupItems(group, role);

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
                    const isNotifications =
                        itemPath === FRONTEND_ROUTES.NOTIFICATIONS;
                    const count = isNotifications
                        ? unreadCount
                        : (badges?.[item.id] ?? 0);
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
                                    {count > 0 && (
                                        <span
                                            className={cn(
                                                'inline-flex h-[var(--nav-badge-size)] min-w-[var(--nav-badge-size)] items-center justify-center rounded-full px-1 text-[10px] font-bold',
                                                isNotifications
                                                    ? 'bg-primary text-text-inv'
                                                    : 'bg-accent-soft text-accent-text',
                                            )}
                                            aria-label={
                                                isNotifications
                                                    ? `${count} unread notification${count === 1 ? '' : 's'}`
                                                    : `${count} pending`
                                            }
                                        >
                                            {count > 99 ? '99+' : count}
                                        </span>
                                    )}
                                </Link>
                                {hasTabs && (
                                    <button
                                        type="button"
                                        onClick={() => onToggleSection(item.id)}
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
