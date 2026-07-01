import { Link, useSearchParams } from 'react-router-dom';
import { UserRole } from '@/constants/enums';
import { resolveNavPath, useNavTabs, type NavEntry } from '@/config/navigation';
import { cn } from '@/lib/utils';

interface SidebarPanelTabsProps {
    entry: NavEntry;
    role: UserRole;
    /** True when this entry owns the current route — drives sub-tab highlighting. */
    isActive: boolean;
    id?: string;
    onNavigate?: () => void;
}

/**
 * The nested sub-tab list under an expanded tabbed item in the panel. Each tab is
 * a plain `<Link>` to the hub's base path + `?<param>=<key>` (the first tab drops
 * the param → canonical bare path), mirroring `useTabParam`. Role gating and
 * label/icon-by-role come from `useNavTabs`.
 */
export function SidebarPanelTabs({
    entry,
    role,
    isActive,
    id,
    onNavigate,
}: SidebarPanelTabsProps) {
    const tabs = useNavTabs(entry.id);
    const [params] = useSearchParams();

    if (tabs.length === 0) return null;

    const base = resolveNavPath(entry, role);
    const param = entry.tabParam ?? 'tab';
    const keys = tabs.map((tab) => tab.key);
    const raw = params.get(param);
    const activeKey = isActive ? (raw && keys.includes(raw) ? raw : keys[0]) : null;

    return (
        <ul
            id={id}
            className="ml-[var(--nav-subtab-indent)] mt-0.5 flex flex-col gap-0.5 border-l border-border pb-1 pl-2"
        >
            {tabs.map((tab, i) => {
                const active = tab.key === activeKey;
                const to = i === 0 ? base : `${base}?${param}=${tab.key}`;
                const Icon = tab.Icon;
                return (
                    <li key={tab.key}>
                        <Link
                            to={to}
                            onClick={onNavigate}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus/25',
                                active
                                    ? 'bg-surface-2 font-semibold text-text-1'
                                    : 'font-medium text-text-3 hover:bg-surface-2 hover:text-text-1',
                            )}
                        >
                            {Icon && <Icon size={14} aria-hidden className="flex-shrink-0" />}
                            <span className="truncate">{tab.label}</span>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}
