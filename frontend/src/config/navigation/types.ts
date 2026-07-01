import { type IconType } from 'react-icons';
import { UserRole } from '@/constants/enums';

/**
 * Navigation type definitions for the app's single nav spine. See the sibling
 * `sidebar.ts` (sections), `workspace-tabs.ts` (nested tabs), and
 * `use-nav-tabs.ts` (the role-aware selector).
 */

export type NavGroup =
    | 'Overview'
    | 'Sales'
    | 'Fulfillment'
    | 'Inventory'
    | 'Finance'
    | 'People'
    | 'System';

/** A sub-tab within a workspace. `label`/`Icon` are the default; the optional
 *  `*ByRole` maps override them per role (Branch hub: Directory / My Branch). */
export interface NavTab {
    key: string;
    label: string;
    Icon?: IconType;
    /** When present, only these roles see the tab. Omit = visible to all. */
    roles?: UserRole[];
    labelByRole?: Partial<Record<UserRole, string>>;
    iconByRole?: Partial<Record<UserRole, IconType>>;
}

/** A sidebar section. `tabs` present ⇒ the section is a tabbed workspace. */
export interface NavEntry {
    /** Stable workspace id used by `useNavTabs` (e.g. `sales`). */
    id: string;
    /** i18n key under the `common` namespace (e.g. `nav.sales`). */
    label: string;
    path: string;
    Icon: IconType;
    roles: UserRole[];
    group: NavGroup;
    pathByRole?: Partial<Record<UserRole, string>>;
    /** Query param this hub's sub-tabs use in the panel (default `tab`). */
    tabParam?: string;
    tabs?: NavTab[];
}
