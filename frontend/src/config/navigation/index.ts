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
