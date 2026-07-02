import {
    LuBadgeCheck as BadgeCheck,
    LuBadgePercent as BadgePercent,
    LuBarcode as Barcode,
    LuBell as Bell,
    LuBoxes as Boxes,
    LuBriefcase as Briefcase,
    LuBuilding2 as Building2,
    LuCalculator as Calculator,
    LuCalendarCheck as CalendarCheck,
    LuCalendarClock as CalendarClock,
    LuCalendarRange as CalendarRange,
    LuChartColumnBig as BarChart3,
    LuClipboardList as ClipboardList,
    LuFileClock as FileClock,
    LuFileText as FileText,
    LuGitCompareArrows as GitCompareArrows,
    LuHandCoins as HandCoins,
    LuHouse as Home,
    LuNotebookTabs as NotebookTabs,
    LuPackagePlus as PackagePlus,
    LuPiggyBank as PiggyBank,
    LuReceipt as Receipt,
    LuScale as Scale,
    LuScrollText as ScrollText,
    LuSettings2 as Settings2,
    LuShoppingBag as ShoppingBag,
    LuShoppingCart as ShoppingCart,
    LuSparkles as Sparkles,
    LuStar as Star,
    LuStore as Store,
    LuTags as Tags,
    LuTrophy as Trophy,
    LuTruck as Truck,
    LuUndo2 as Undo2,
    LuUsers as Users,
    LuWallet as Wallet,
} from 'react-icons/lu';
import { UserRole } from '@/constants/enums';
import { FRONTEND_ROUTES as R } from '@/constants/routes';
import { type NavEntry } from './types';

const { ADMIN, MANAGER, CASHIER, WORKER } = UserRole;

/**
 * The sidebar — every section, in render order, grouped and role-gated. The
 * tabbed hubs inline their `tabs`; tabs for non-sidebar workspaces live in
 * `workspace-tabs.ts`. This is the single source of truth for the left nav.
 */
export const SIDEBAR: NavEntry[] = [
    // ── Overview ──
    { id: 'dashboard-admin', label: 'nav.dashboard', path: R.DASHBOARD, Icon: Home, roles: [ADMIN, MANAGER], group: 'Overview' },
    { id: 'dashboard-cashier', label: 'nav.dashboard', path: R.CASHIER_DASHBOARD, Icon: Home, roles: [CASHIER], group: 'Overview' },
    { id: 'dashboard-worker', label: 'nav.dashboard', path: R.WORKER_DASHBOARD, Icon: Home, roles: [WORKER], group: 'Overview' },

    // ── Sales ──
    { id: 'pos', label: 'nav.pos', path: R.POS, Icon: Receipt, roles: [CASHIER], group: 'Sales' },
    {
        id: 'sales', label: 'nav.sales', path: R.SALES, Icon: ShoppingBag,
        roles: [ADMIN, MANAGER, CASHIER], group: 'Sales',
        tabs: [
            { key: 'transactions', label: 'Transactions', Icon: ScrollText, roles: [CASHIER, ADMIN, MANAGER] },
            { key: 'orders', label: 'Customer orders', Icon: ShoppingCart, roles: [CASHIER, ADMIN, MANAGER] },
            { key: 'schemes', label: 'Discount schemes', Icon: BadgePercent, roles: [ADMIN, MANAGER] },
            { key: 'salesman', label: 'Salesman report', Icon: BarChart3, roles: [ADMIN, MANAGER] },
        ],
    },
    {
        id: 'returns', label: 'nav.returns', path: R.RETURNS, Icon: Undo2,
        roles: [ADMIN, MANAGER, CASHIER], group: 'Sales',
        tabs: [
            { key: 'list', label: 'Returns', Icon: Undo2 },
            { key: 'analytics', label: 'Analytics', Icon: BarChart3 },
        ],
    },
    { id: 'cashier-store-credit', label: 'nav.storeCredit', path: R.STORE_CREDIT, Icon: NotebookTabs, roles: [CASHIER], group: 'Sales' },
    { id: 'cashier-loyalty', label: 'nav.customerLoyalty', path: R.CASHIER_LOYALTY, Icon: Sparkles, roles: [CASHIER], group: 'Sales' },

    // ── Fulfillment ──
    { id: 'my-deliveries', label: 'nav.myDeliveries', path: R.SHIPMENTS, Icon: Truck, roles: [WORKER], group: 'Fulfillment' },
    { id: 'shipments', label: 'nav.shipments', path: R.SHIPMENTS, Icon: Truck, roles: [ADMIN, MANAGER], group: 'Fulfillment' },

    // ── Inventory ──
    {
        id: 'inventory', label: 'nav.inventory', path: R.INVENTORY, Icon: Boxes,
        roles: [ADMIN, MANAGER], group: 'Inventory',
        tabs: [
            { key: 'list', label: 'Inventory', Icon: Boxes },
            { key: 'expiry', label: 'Expiry', Icon: CalendarClock },
            { key: 'adjustments', label: 'Adjustments', Icon: ClipboardList },
            { key: 'transfers', label: 'Transfers', Icon: Truck },
            { key: 'categories', label: 'Categories', Icon: Tags },
            { key: 'labels', label: 'Labels', Icon: Barcode },
        ],
    },
    {
        id: 'purchases', label: 'nav.purchases', path: R.PURCHASES, Icon: PackagePlus,
        roles: [ADMIN, MANAGER], group: 'Inventory',
        tabs: [
            { key: 'grns', label: 'Goods receipts', Icon: ClipboardList },
            { key: 'new-grn', label: 'New GRN', Icon: PackagePlus },
            { key: 'orders', label: 'Purchase orders', Icon: FileText },
            { key: 'reorder', label: 'Reorder', Icon: Sparkles },
            { key: 'bills', label: 'Bills & Payments', Icon: Wallet },
            { key: 'ageing', label: 'Ageing', Icon: CalendarClock },
            { key: 'suppliers', label: 'Suppliers', Icon: Building2 },
        ],
    },
    {
        id: 'brand-analytics', label: 'nav.brandAnalysis', path: R.BRAND_ANALYTICS, Icon: Trophy,
        roles: [ADMIN, MANAGER], group: 'Inventory',
        tabs: [
            { key: 'brands', label: 'Brands', Icon: Trophy },
            { key: 'by-category', label: 'By category', Icon: Tags },
            { key: 'by-branch', label: 'By branch', Icon: GitCompareArrows },
            { key: 'manage', label: 'Manage', Icon: Settings2 },
        ],
    },

    // ── Finance ──
    {
        id: 'accounting', label: 'nav.accounting', path: R.ACCOUNTING, Icon: Calculator,
        roles: [ADMIN, MANAGER], group: 'Finance',
        tabs: [
            { key: 'ledger', label: 'Ledger', Icon: ScrollText, roles: [ADMIN] },
            { key: 'receivables', label: 'Receivables', Icon: HandCoins, roles: [ADMIN, MANAGER] },
            { key: 'reports', label: 'Financial reports', Icon: Scale, roles: [ADMIN] },
            { key: 'expenses', label: 'Expenses', Icon: Wallet, roles: [ADMIN, MANAGER] },
            { key: 'profit-loss', label: 'Profit & Loss', Icon: PiggyBank, roles: [ADMIN] },
        ],
    },
    {
        id: 'credit-accounts', label: 'nav.storeCredit', path: R.CREDIT_ACCOUNTS, Icon: NotebookTabs,
        roles: [ADMIN, MANAGER], group: 'Finance',
        tabs: [
            { key: 'approvals', label: 'Approvals', Icon: BadgeCheck },
            { key: 'accounts', label: 'Accounts', Icon: HandCoins },
        ],
    },
    { id: 'reports', label: 'nav.reports', path: R.REPORTS, Icon: BarChart3, roles: [ADMIN, MANAGER], group: 'Finance' },

    // ── People ──
    { id: 'customers', label: 'nav.customers', path: R.CUSTOMERS, Icon: Users, roles: [ADMIN, MANAGER], group: 'People' },
    { id: 'loyalty-admin', label: 'nav.customerLoyalty', path: R.ADMIN_LOYALTY, Icon: Sparkles, roles: [ADMIN], group: 'People' },
    { id: 'loyalty-manager', label: 'nav.customerLoyalty', path: R.MANAGER_LOYALTY, Icon: Sparkles, roles: [MANAGER], group: 'People' },
    { id: 'users', label: 'nav.users', path: R.USER_MANAGEMENT, Icon: Users, roles: [ADMIN], group: 'People' },
    {
        id: 'hr', label: 'nav.hr', path: R.ADMIN_HR, Icon: Briefcase,
        roles: [ADMIN, MANAGER], group: 'People',
        tabs: [
            { key: 'employees', label: 'Employees', Icon: BadgeCheck },
            { key: 'attendance', label: 'Attendance', Icon: CalendarCheck },
            { key: 'leaves', label: 'Leaves', Icon: CalendarRange },
            { key: 'payroll', label: 'Payroll', Icon: Wallet },
        ],
    },
    { id: 'leaves', label: 'nav.leaves', path: R.ADMIN_LEAVES, Icon: CalendarRange, roles: [CASHIER], group: 'People' },

    // ── System ──
    {
        id: 'branches', label: 'nav.branches', path: R.BRANCHES, Icon: Building2,
        roles: [ADMIN, MANAGER], group: 'System',
        tabs: [
            {
                key: 'overview', label: 'Directory', Icon: Building2,
                labelByRole: { [MANAGER]: 'My Branch' },
                iconByRole: { [MANAGER]: Store },
            },
            { key: 'compare', label: 'Compare', Icon: GitCompareArrows },
        ],
    },
    { id: 'audit', label: 'nav.auditLog', path: R.ADMIN_AUDIT, Icon: FileClock, roles: [ADMIN], group: 'System' },
    { id: 'review-moderation', label: 'nav.reviews', path: R.ADMIN_REVIEWS, Icon: Star, roles: [ADMIN, MANAGER], group: 'System' },
    { id: 'notifications', label: 'nav.notifications', path: R.NOTIFICATIONS, Icon: Bell, roles: [ADMIN, MANAGER, CASHIER], group: 'System' },
];
