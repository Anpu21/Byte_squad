import { useMemo } from 'react';
import { type IconType } from 'react-icons';
import {
    LuBadgeCheck as BadgeCheck,
    LuBadgePercent as BadgePercent,
    LuBarcode as Barcode,
    LuBell as Bell,
    LuBookOpenCheck as BookOpenCheck,
    LuBoxes as Boxes,
    LuBriefcase as Briefcase,
    LuBuilding2 as Building2,
    LuCalculator as Calculator,
    LuCalendarCheck as CalendarCheck,
    LuCalendarClock as CalendarClock,
    LuCalendarDays as CalendarDays,
    LuCalendarRange as CalendarRange,
    LuChartColumnBig as BarChart3,
    LuClipboardList as ClipboardList,
    LuFileClock as FileClock,
    LuFileText as FileText,
    LuGitCompareArrows as GitCompareArrows,
    LuHandCoins as HandCoins,
    LuHouse as Home,
    LuLock as Lock,
    LuPackagePlus as PackagePlus,
    LuPiggyBank as PiggyBank,
    LuReceipt as Receipt,
    LuScale as Scale,
    LuScrollText as ScrollText,
    LuShoppingBag as ShoppingBag,
    LuShoppingCart as ShoppingCart,
    LuSparkles as Sparkles,
    LuStore as Store,
    LuTags as Tags,
    LuTruck as Truck,
    LuUndo2 as Undo2,
    LuUsers as Users,
    LuWallet as Wallet,
} from 'react-icons/lu';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { type TabItem } from '@/components/ui';

/**
 * The single source of truth for app navigation — every sidebar section and the
 * sub-tabs of every tabbed workspace. The sidebar (`DashboardLayout`) reads
 * {@link SIDEBAR}; each workspace page reads its tabs via {@link useNavTabs}.
 * Keep route/role metadata here, not scattered across page files.
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
    /** Stable workspace id used by {@link useNavTabs} (e.g. `sales`). */
    id: string;
    /** i18n key under the `common` namespace (e.g. `nav.sales`). */
    label: string;
    path: string;
    Icon: IconType;
    roles: UserRole[];
    group: NavGroup;
    pathByRole?: Partial<Record<UserRole, string>>;
    tabs?: NavTab[];
}

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

/** Sidebar sections, in render order. The 6 tabbed hubs inline their `tabs`. */
export const SIDEBAR: NavEntry[] = [
    // ── Overview ──
    {
        id: 'dashboard-admin',
        label: 'nav.dashboard',
        path: FRONTEND_ROUTES.DASHBOARD,
        Icon: Home,
        roles: [UserRole.ADMIN, UserRole.MANAGER],
        group: 'Overview',
    },
    {
        id: 'dashboard-cashier',
        label: 'nav.dashboard',
        path: FRONTEND_ROUTES.CASHIER_DASHBOARD,
        Icon: Home,
        roles: [UserRole.CASHIER],
        group: 'Overview',
    },
    {
        id: 'dashboard-worker',
        label: 'nav.dashboard',
        path: FRONTEND_ROUTES.WORKER_DASHBOARD,
        Icon: Home,
        roles: [UserRole.WORKER],
        group: 'Overview',
    },
    // ── Sales ──
    {
        id: 'pos',
        label: 'nav.pos',
        path: FRONTEND_ROUTES.POS,
        Icon: Receipt,
        roles: [UserRole.CASHIER],
        group: 'Sales',
    },
    {
        id: 'sales',
        label: 'nav.sales',
        path: FRONTEND_ROUTES.SALES,
        Icon: ShoppingBag,
        roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER],
        group: 'Sales',
        tabs: [
            {
                key: 'transactions',
                label: 'Transactions',
                Icon: ScrollText,
                roles: [UserRole.CASHIER, UserRole.ADMIN, UserRole.MANAGER],
            },
            {
                key: 'orders',
                label: 'Customer orders',
                Icon: ShoppingCart,
                roles: [UserRole.CASHIER, UserRole.ADMIN, UserRole.MANAGER],
            },
            {
                key: 'schemes',
                label: 'Discount schemes',
                Icon: BadgePercent,
                roles: [UserRole.ADMIN, UserRole.MANAGER],
            },
            {
                key: 'salesman',
                label: 'Salesman report',
                Icon: BarChart3,
                roles: [UserRole.ADMIN, UserRole.MANAGER],
            },
        ],
    },
    // ── Fulfillment ──
    {
        id: 'my-deliveries',
        label: 'nav.myDeliveries',
        path: FRONTEND_ROUTES.SHIPMENTS,
        Icon: Truck,
        roles: [UserRole.WORKER],
        group: 'Fulfillment',
    },
    {
        id: 'shipments',
        label: 'nav.shipments',
        path: FRONTEND_ROUTES.SHIPMENTS,
        Icon: Truck,
        roles: [UserRole.ADMIN, UserRole.MANAGER],
        group: 'Fulfillment',
    },
    // ── Inventory ──
    {
        id: 'inventory',
        label: 'nav.inventory',
        path: FRONTEND_ROUTES.INVENTORY,
        Icon: Boxes,
        roles: [UserRole.ADMIN, UserRole.MANAGER],
        group: 'Inventory',
        tabs: [
            { key: 'list', label: 'Inventory', Icon: Boxes },
            { key: 'expiry', label: 'Expiry', Icon: CalendarClock },
            { key: 'adjustments', label: 'Adjustments', Icon: ClipboardList },
            { key: 'returns', label: 'Returns', Icon: Undo2 },
            { key: 'transfers', label: 'Transfers', Icon: Truck },
            { key: 'categories', label: 'Categories', Icon: Tags },
            { key: 'labels', label: 'Labels', Icon: Barcode },
        ],
    },
    {
        id: 'purchases',
        label: 'nav.purchases',
        path: FRONTEND_ROUTES.PURCHASES,
        Icon: PackagePlus,
        roles: [UserRole.ADMIN, UserRole.MANAGER],
        group: 'Inventory',
        tabs: [
            { key: 'grns', label: 'Goods receipts', Icon: ClipboardList },
            { key: 'new-grn', label: 'New GRN', Icon: PackagePlus },
            { key: 'orders', label: 'Purchase orders', Icon: FileText },
            { key: 'bills', label: 'Bills & Payments', Icon: Wallet },
            { key: 'ageing', label: 'Ageing', Icon: CalendarClock },
            { key: 'suppliers', label: 'Suppliers', Icon: Building2 },
        ],
    },
    // ── Finance ──
    {
        id: 'accounting',
        label: 'nav.accounting',
        path: FRONTEND_ROUTES.ACCOUNTING,
        Icon: Calculator,
        roles: [UserRole.ADMIN, UserRole.MANAGER],
        group: 'Finance',
        tabs: [
            {
                key: 'ledger',
                label: 'Ledger',
                Icon: ScrollText,
                roles: [UserRole.ADMIN],
            },
            {
                key: 'receivables',
                label: 'Receivables',
                Icon: HandCoins,
                roles: [UserRole.ADMIN, UserRole.MANAGER],
            },
            {
                key: 'reports',
                label: 'Financial reports',
                Icon: Scale,
                roles: [UserRole.ADMIN],
            },
            {
                key: 'expenses',
                label: 'Expenses',
                Icon: Wallet,
                roles: [UserRole.ADMIN, UserRole.MANAGER],
            },
            {
                key: 'profit-loss',
                label: 'Profit & Loss',
                Icon: PiggyBank,
                roles: [UserRole.ADMIN],
            },
        ],
    },
    {
        id: 'reports',
        label: 'nav.reports',
        path: FRONTEND_ROUTES.REPORTS,
        Icon: BarChart3,
        roles: [UserRole.ADMIN, UserRole.MANAGER],
        group: 'Finance',
    },
    // ── People ──
    {
        id: 'loyalty-admin',
        label: 'nav.customerLoyalty',
        path: FRONTEND_ROUTES.ADMIN_LOYALTY,
        Icon: Sparkles,
        roles: [UserRole.ADMIN],
        group: 'People',
    },
    {
        id: 'loyalty-manager',
        label: 'nav.customerLoyalty',
        path: FRONTEND_ROUTES.MANAGER_LOYALTY,
        Icon: Sparkles,
        roles: [UserRole.MANAGER],
        group: 'People',
    },
    {
        id: 'users',
        label: 'nav.users',
        path: FRONTEND_ROUTES.USER_MANAGEMENT,
        Icon: Users,
        roles: [UserRole.ADMIN],
        group: 'People',
    },
    {
        id: 'hr',
        label: 'nav.hr',
        path: FRONTEND_ROUTES.ADMIN_HR,
        Icon: Briefcase,
        roles: [UserRole.ADMIN, UserRole.MANAGER],
        group: 'People',
        tabs: [
            { key: 'employees', label: 'Employees', Icon: BadgeCheck },
            { key: 'attendance', label: 'Attendance', Icon: CalendarCheck },
            { key: 'leaves', label: 'Leaves', Icon: CalendarRange },
            { key: 'payroll', label: 'Payroll', Icon: Wallet },
        ],
    },
    {
        id: 'leaves',
        label: 'nav.leaves',
        path: FRONTEND_ROUTES.ADMIN_LEAVES,
        Icon: CalendarRange,
        roles: [UserRole.CASHIER],
        group: 'People',
    },
    // ── System ──
    {
        id: 'branches',
        label: 'nav.branches',
        path: FRONTEND_ROUTES.BRANCHES,
        Icon: Building2,
        roles: [UserRole.ADMIN, UserRole.MANAGER],
        group: 'System',
        tabs: [
            {
                key: 'overview',
                label: 'Directory',
                Icon: Building2,
                labelByRole: { [UserRole.MANAGER]: 'My Branch' },
                iconByRole: { [UserRole.MANAGER]: Store },
            },
            { key: 'compare', label: 'Compare', Icon: GitCompareArrows },
        ],
    },
    {
        id: 'audit',
        label: 'nav.auditLog',
        path: FRONTEND_ROUTES.ADMIN_AUDIT,
        Icon: FileClock,
        roles: [UserRole.ADMIN],
        group: 'System',
    },
    {
        id: 'notifications',
        label: 'nav.notifications',
        path: FRONTEND_ROUTES.NOTIFICATIONS,
        Icon: Bell,
        roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER],
        group: 'System',
    },
];

/**
 * Tabs for workspaces that are *not* sidebar sections — they're nested inside a
 * hub (Financial reports → Accounting; the two transfer screens → Inventory) or
 * reached only by route, so they have no standalone sidebar identity.
 */
export const WORKSPACE_TABS: Record<string, NavTab[]> = {
    'financial-reports': [
        { key: 'trial-balance', label: 'Trial balance', Icon: Scale },
        { key: 'balance-sheet', label: 'Balance sheet', Icon: BookOpenCheck },
        { key: 'day-book', label: 'Day book', Icon: CalendarDays },
        { key: 'periods', label: 'Period locks', Icon: Lock },
    ],
    // Dynamic count badges are overlaid by the page at render time.
    'admin-transfers': [
        { key: 'board', label: 'Pipeline' },
        { key: 'history', label: 'History' },
        { key: 'report', label: 'Report' },
    ],
    'transfer-requests': [
        { key: 'my-requests', label: 'My Requests' },
        { key: 'incoming', label: 'Incoming' },
        { key: 'history', label: 'History' },
    ],
};

/** Role-aware path for a sidebar entry (some routes differ by role). */
export function resolveNavPath(entry: NavEntry, role?: UserRole): string {
    if (role && entry.pathByRole?.[role]) return entry.pathByRole[role]!;
    return entry.path;
}

/** The sidebar's render inputs: ordered groups + their sections. */
export function getSidebarSections(): { groups: NavGroup[]; items: NavEntry[] } {
    return { groups: GROUP_ORDER, items: SIDEBAR };
}

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
