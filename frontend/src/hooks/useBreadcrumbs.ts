import { useLocation, useMatches, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import {
    getActiveSection,
    resolveNavPath,
    useNavTabs,
} from '@/config/navigation';

interface CrumbHandle {
    crumbs?: string[];
}

/**
 * Breadcrumb segments for the current route.
 *
 * For a tabbed workspace sitting on its own path (e.g. `/sales?tab=transactions`),
 * the crumbs are derived from the nav config — `[workspace, active sub-tab]`, i.e.
 * "Sales › Transactions" — so the topbar reflects the `?tab=` the sidebar selected
 * and the page itself can drop its in-content title. Every other route keeps the
 * static `handle.crumbs` co-located in `config/*.routes.tsx` (deepest match wins);
 * a route with no `handle` yields `[]` and the header renders no breadcrumb.
 */
export function useBreadcrumbs(): string[] {
    const matches = useMatches();
    const { pathname } = useLocation();
    const [params] = useSearchParams();
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const role = user?.role as UserRole | undefined;

    const section = role ? getActiveSection(pathname, role) : null;
    // Called unconditionally (rules of hooks); '' → no tabs for non-workspaces.
    const tabs = useNavTabs(section?.item.id ?? '');

    // A tabbed workspace on its own path → "Workspace › active sub-tab".
    if (
        section &&
        role &&
        section.item.tabs?.length &&
        tabs.length > 0 &&
        pathname === resolveNavPath(section.item, role)
    ) {
        const key = params.get(section.item.tabParam ?? 'tab');
        const active = tabs.find((tab) => tab.key === key) ?? tabs[0];
        return active
            ? [t(section.item.label), active.label]
            : [t(section.item.label)];
    }

    // Otherwise: the deepest matched route's static crumbs.
    for (let i = matches.length - 1; i >= 0; i--) {
        const handle = matches[i].handle as CrumbHandle | undefined;
        if (handle?.crumbs) return handle.crumbs;
    }
    return [];
}
