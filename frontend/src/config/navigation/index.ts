import { UserRole } from '@/constants/enums';
import { GROUP_ORDER } from './groups';
import { SIDEBAR } from './sidebar';
import { type NavEntry, type NavGroup } from './types';

/**
 * The app's single navigation spine. This barrel is the import contract —
 * always import from `@/config/navigation`, never the inner files.
 *
 * - `SIDEBAR` / `GROUP_ORDER` / `GROUP_LABEL_KEY` — the sidebar (`sidebar.ts`,
 *   `groups.ts`), consumed by `layouts/DashboardLayout`.
 * - `useNavTabs(id)` — role-filtered tabs for a tabbed workspace
 *   (`use-nav-tabs.ts`), consumed by each workspace page.
 * - `WORKSPACE_TABS` — tabs for non-sidebar workspaces (`workspace-tabs.ts`).
 */
export * from './types';
export * from './groups';
export * from './sidebar';
export * from './workspace-tabs';
export * from './use-nav-tabs';

/** Role-aware path for a sidebar entry (some routes differ by role). */
export function resolveNavPath(entry: NavEntry, role?: UserRole): string {
    if (role && entry.pathByRole?.[role]) return entry.pathByRole[role]!;
    return entry.path;
}

/** The sidebar's render inputs: ordered groups + their sections. */
export function getSidebarSections(): { groups: NavGroup[]; items: NavEntry[] } {
    return { groups: GROUP_ORDER, items: SIDEBAR };
}

/** Sidebar items visible to a role. */
export function getRoleItems(role: UserRole): NavEntry[] {
    return SIDEBAR.filter((item) => item.roles.includes(role));
}

/** A group's role-visible items, in `SIDEBAR` order. */
export function getGroupItems(group: NavGroup, role: UserRole): NavEntry[] {
    return getRoleItems(role).filter((item) => item.group === group);
}

/** Groups with at least one item for this role, in render order. */
export function getVisibleGroups(role: UserRole): NavGroup[] {
    return GROUP_ORDER.filter((group) => getGroupItems(group, role).length > 0);
}

/**
 * Routes that share no path prefix with their conceptual sidebar parent, mapped
 * to the owning sidebar item id. Consulted only after exact/prefix matching
 * misses. Every `itemId` must exist in `SIDEBAR`.
 */
const ROUTE_SECTION_OVERRIDES: { test: (pathname: string) => boolean; itemId: string }[] = [
    { test: (p) => p === '/transfers' || p.startsWith('/transfers/'), itemId: 'inventory' },
    { test: (p) => p === '/admin/transfers' || p.startsWith('/admin/transfers/'), itemId: 'inventory' },
    { test: (p) => /^\/admin\/(employees|attendance|payroll)(\/|$)/.test(p), itemId: 'hr' },
];

/**
 * Resolve a route to its sidebar section (group + item) for the two-tier nav.
 * Pass `location.pathname` (no query string). Returns `null` for routes owned by
 * no sidebar item (e.g. `/profile`) — callers fall back to the last/first group.
 */
export function getActiveSection(
    pathname: string,
    role: UserRole,
): { group: NavGroup; item: NavEntry } | null {
    const candidates = getRoleItems(role).map((item) => ({
        item,
        p: resolveNavPath(item, role),
    }));

    // 1. Exact match — query is excluded, so `/accounting?tab=x` arrives as `/accounting`.
    const exact = candidates.find(({ p }) => p === pathname);
    if (exact) return { group: exact.item.group, item: exact.item };

    // 2. Longest segment-prefix — `/inventory/add` → inventory, `/accounting/reports` → accounting.
    let best: { item: NavEntry; p: string } | null = null;
    for (const cand of candidates) {
        if (cand.p !== '/' && pathname.startsWith(cand.p + '/')) {
            if (!best || cand.p.length > best.p.length) best = cand;
        }
    }
    if (best) return { group: best.item.group, item: best.item };

    // 3. Explicit overrides for prefix-less routes (skip if the target isn't role-allowed).
    for (const override of ROUTE_SECTION_OVERRIDES) {
        if (!override.test(pathname)) continue;
        const match = candidates.find(({ item }) => item.id === override.itemId)?.item;
        if (match) return { group: match.group, item: match };
    }

    // 4. No sidebar owner.
    return null;
}
