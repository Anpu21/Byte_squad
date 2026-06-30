import { useRef, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserRole } from '@/constants/enums';
import {
    GROUP_ICON,
    GROUP_LABEL_KEY,
    getGroupItems,
    getVisibleGroups,
    resolveNavPath,
    type NavGroup,
} from '@/config/navigation';
import { NAV_ICON, Tooltip } from '@/components/ui';
import Logo from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

interface SidebarRailProps {
    role: UserRole;
    activeGroup: NavGroup | null;
    onNavigate?: () => void;
}

/**
 * The thin icon rail of the two-tier sidebar — one icon per visible nav group.
 * Clicking a group lands on its first role-allowed item; the panel follows the
 * route. Roving tabindex + vertical arrow keys move focus between groups.
 */
export function SidebarRail({ role, activeGroup, onNavigate }: SidebarRailProps) {
    const { t } = useTranslation('common');
    const groups = getVisibleGroups(role);
    const links = useRef<(HTMLAnchorElement | null)[]>([]);

    if (groups.length === 0) return null;

    const onKeyDown = (e: KeyboardEvent, index: number) => {
        const last = groups.length - 1;
        let next: number;
        if (e.key === 'ArrowDown') next = index >= last ? 0 : index + 1;
        else if (e.key === 'ArrowUp') next = index <= 0 ? last : index - 1;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = last;
        else return;
        e.preventDefault();
        links.current[next]?.focus();
    };

    // Only one rail link is in the tab order (roving tabindex); the active group,
    // or the first when none is active.
    const focusIndex = Math.max(0, groups.indexOf(activeGroup as NavGroup));

    return (
        <div className="flex w-[var(--nav-rail-w)] flex-shrink-0 flex-col items-center border-r border-border bg-surface py-3">
            <Link
                to={resolveNavPath(getGroupItems(groups[0], role)[0], role)}
                onClick={onNavigate}
                aria-label="Ledger Pro"
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus/25"
            >
                <Logo size={28} label={false} />
            </Link>

            <nav
                aria-label={t('shell.primaryNav')}
                className="flex flex-col items-center gap-1"
            >
                {groups.map((group, i) => {
                    const Icon = GROUP_ICON[group];
                    const label = t(GROUP_LABEL_KEY[group]);
                    const active = group === activeGroup;
                    return (
                        <Tooltip key={group} label={label}>
                            <Link
                                ref={(el) => {
                                    links.current[i] = el;
                                }}
                                to={resolveNavPath(getGroupItems(group, role)[0], role)}
                                onClick={onNavigate}
                                onKeyDown={(e) => onKeyDown(e, i)}
                                aria-label={label}
                                aria-current={active ? 'page' : undefined}
                                tabIndex={i === focusIndex ? 0 : -1}
                                className={cn(
                                    'flex h-10 w-10 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus/25',
                                    active
                                        ? 'bg-surface-2 text-primary'
                                        : 'text-text-3 hover:bg-surface-2 hover:text-text-1',
                                )}
                            >
                                <Icon size={NAV_ICON} strokeWidth={2} aria-hidden />
                            </Link>
                        </Tooltip>
                    );
                })}
            </nav>
        </div>
    );
}
