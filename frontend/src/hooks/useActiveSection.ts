import { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { getActiveSection, getVisibleGroups, type NavGroup } from '@/config/navigation';

/**
 * Resolves the current route to its two-tier nav section: the active `group`
 * (drives the rail) and `itemId` (drives the panel). On routes owned by no
 * sidebar item (e.g. `/profile`) it keeps the last resolved group so the panel
 * stays stable, falling back to the first visible group on first paint.
 */
export function useActiveSection(): { group: NavGroup | null; itemId: string | null } {
    const { pathname } = useLocation();
    const { user } = useAuth();
    const role = user?.role as UserRole | undefined;

    const section = useMemo(
        () => (role ? getActiveSection(pathname, role) : null),
        [pathname, role],
    );

    const lastGroup = useRef<NavGroup | null>(null);
    useEffect(() => {
        if (section) lastGroup.current = section.group;
    }, [section]);

    if (section) return { group: section.group, itemId: section.item.id };
    const fallback = lastGroup.current ?? (role ? getVisibleGroups(role)[0] ?? null : null);
    return { group: fallback, itemId: null };
}
