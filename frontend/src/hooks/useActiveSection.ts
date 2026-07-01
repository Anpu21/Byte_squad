import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { getActiveSection, getVisibleGroups, type NavGroup } from '@/config/navigation';

/**
 * Resolves the current route to its two-tier nav section: the active `group`
 * (drives the rail) and `itemId` (drives the panel). On routes owned by no
 * sidebar item (e.g. `/profile`) it falls back to the first visible group so the
 * rail still shows a sensible active state.
 */
export function useActiveSection(): { group: NavGroup | null; itemId: string | null } {
    const { pathname } = useLocation();
    const { user } = useAuth();
    const role = user?.role as UserRole | undefined;

    const section = useMemo(
        () => (role ? getActiveSection(pathname, role) : null),
        [pathname, role],
    );

    if (section) return { group: section.group, itemId: section.item.id };
    return {
        group: role ? (getVisibleGroups(role)[0] ?? null) : null,
        itemId: null,
    };
}
