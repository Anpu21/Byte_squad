import { type IconType } from 'react-icons';
import {
    LuLayoutDashboard as OverviewIcon,
    LuShoppingBag as SalesIcon,
    LuTruck as FulfillmentIcon,
    LuBoxes as InventoryIcon,
    LuWallet as FinanceIcon,
    LuUsers as PeopleIcon,
    LuSettings2 as SystemIcon,
} from 'react-icons/lu';
import { type NavGroup } from './types';

/** Sidebar groups, in render order. */
export const GROUP_ORDER: NavGroup[] = [
    'Overview',
    'Sales',
    'Fulfillment',
    'Inventory',
    'Finance',
    'People',
    'System',
];

/** Group header → i18n key under `common` (`nav.groups.*`). */
export const GROUP_LABEL_KEY: Record<NavGroup, string> = {
    Overview: 'nav.groups.overview',
    Sales: 'nav.groups.sales',
    Fulfillment: 'nav.groups.fulfillment',
    Inventory: 'nav.groups.inventory',
    Finance: 'nav.groups.finance',
    People: 'nav.groups.people',
    System: 'nav.groups.system',
};

/** Group header → rail icon for the two-tier sidebar. */
export const GROUP_ICON: Record<NavGroup, IconType> = {
    Overview: OverviewIcon,
    Sales: SalesIcon,
    Fulfillment: FulfillmentIcon,
    Inventory: InventoryIcon,
    Finance: FinanceIcon,
    People: PeopleIcon,
    System: SystemIcon,
};
