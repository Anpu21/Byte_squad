import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { type TabItem } from '@/components/ui';
import { type NavTab } from './types';
import { SIDEBAR } from './sidebar';
import { WORKSPACE_TABS } from './workspace-tabs';

/** All tab definitions, keyed by workspace id (hub tabs + nested workspaces). */
const TAB_SOURCES: Record<string, NavTab[]> = {
    ...Object.fromEntries(
        SIDEBAR.filter((e) => e.tabs).map((e) => [e.id, e.tabs!]),
    ),
    ...WORKSPACE_TABS,
};

/** Resolve a definition to a render-ready {@link TabItem} for the given role. */
function resolveTab<T extends string>(t: NavTab, role?: UserRole): TabItem<T> {
    return {
        key: t.key as T,
        label: (role && t.labelByRole?.[role]) ?? t.label,
        Icon: (role && t.iconByRole?.[role]) ?? t.Icon,
    };
}

/**
 * Role-filtered, render-ready tabs for a workspace id. Static metadata only —
 * pages overlay dynamic badges (e.g. transfer counts) after calling this. Tabs
 * with a `roles` list are hidden from other roles (and the page derives its
 * `valid` key set from the result, so a role can't deep-link a forbidden tab).
 */
export function useNavTabs<T extends string>(id: string): TabItem<T>[] {
    const { user } = useAuth();
    const role = user?.role as UserRole | undefined;
    return useMemo<TabItem<T>[]>(() => {
        const defs = TAB_SOURCES[id] ?? [];
        return defs
            .filter((t) => !t.roles || (role ? t.roles.includes(role) : false))
            .map((t) => resolveTab<T>(t, role));
    }, [id, role]);
}
