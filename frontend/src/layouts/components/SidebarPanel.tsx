import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

interface SidebarPanelProps {
    group: NavGroup;
    activeItemId: string | null;
    role: UserRole;
    unreadCount: number;
    onNavigate?: () => void;
}

/**
 * The contextual secondary panel of the two-tier sidebar — the active group's
 * role-filtered items as a vertical list, headed by the group label.
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
                    const showBadge =
                        itemPath === FRONTEND_ROUTES.NOTIFICATIONS && unreadCount > 0;
                    return (
                        <li key={item.id}>
                            <Link
                                to={itemPath}
                                onClick={onNavigate}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    'group flex h-[var(--nav-row-h)] items-center gap-2.5 rounded-md px-3 text-[length:var(--nav-label-size)] transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus/25',
                                    active
                                        ? 'bg-surface-2 text-text-1 font-semibold'
                                        : 'font-medium text-text-2 hover:bg-surface-2 hover:text-text-1',
                                )}
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
                                <span className="flex-1 truncate">{t(item.label)}</span>
                                {showBadge && (
                                    <span
                                        className="ml-auto inline-flex h-[var(--nav-badge-size)] min-w-[var(--nav-badge-size)] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-text-inv"
                                        aria-label={`${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`}
                                    >
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
