import { FRONTEND_ROUTES } from '@/constants/routes';

export interface RouteMeta {
    title: string;
    crumbs: string[];
}

/**
 * Map of pathname-pattern -> { title, crumbs }.
 * Dynamic segments (`:productId`, `:id`, `:code`) match anything.
 */
export const ROUTE_META: Record<string, RouteMeta> = {
    [FRONTEND_ROUTES.LOGIN]: { title: 'Sign in', crumbs: ['Sign in'] },
    [FRONTEND_ROUTES.SIGNUP]: { title: 'Create account', crumbs: ['Sign up'] },
    [FRONTEND_ROUTES.OTP_VERIFICATION]: { title: 'Verify your email', crumbs: ['Verify OTP'] },
    [FRONTEND_ROUTES.CHANGE_PASSWORD]: { title: 'Change password', crumbs: ['Change password'] },

    [FRONTEND_ROUTES.DASHBOARD]: { title: 'Dashboard', crumbs: ['Dashboard'] },
    [FRONTEND_ROUTES.CASHIER_DASHBOARD]: { title: 'Cashier dashboard', crumbs: ['Cashier'] },

    [FRONTEND_ROUTES.INVENTORY]: { title: 'Inventory', crumbs: ['Inventory'] },
    [FRONTEND_ROUTES.INVENTORY_EXPIRY]: { title: 'Expiry tracking', crumbs: ['Inventory', 'Expiry'] },
    [FRONTEND_ROUTES.STOCK_ADJUSTMENTS]: { title: 'Stock adjustments', crumbs: ['Inventory', 'Adjustments'] },
    [FRONTEND_ROUTES.STOCK_ADJUSTMENT_NEW]: { title: 'New stock adjustment', crumbs: ['Inventory', 'Adjustments', 'New'] },
    [FRONTEND_ROUTES.RETURNS]: { title: 'Returns', crumbs: ['Inventory', 'Returns'] },
    [FRONTEND_ROUTES.RETURN_NEW]: { title: 'New return', crumbs: ['Inventory', 'Returns', 'New'] },
    [FRONTEND_ROUTES.INVENTORY_ADD]: { title: 'New product', crumbs: ['Inventory', 'Products', 'Add new'] },
    [FRONTEND_ROUTES.INVENTORY_EDIT]: { title: 'Edit product', crumbs: ['Inventory', 'Products', 'Edit'] },
    [FRONTEND_ROUTES.PURCHASES]: { title: 'Purchases', crumbs: ['Inventory', 'Purchases'] },

    [FRONTEND_ROUTES.POS]: { title: 'Point of Sale', crumbs: ['Sales', 'POS'] },
    [FRONTEND_ROUTES.SALES]: { title: 'Sales', crumbs: ['Sales'] },
    [FRONTEND_ROUTES.TRANSACTIONS]: { title: 'Transactions', crumbs: ['Sales', 'Transactions'] },

    [FRONTEND_ROUTES.ACCOUNTING]: { title: 'Accounting', crumbs: ['Accounting'] },
    [FRONTEND_ROUTES.LEDGER]: { title: 'General ledger', crumbs: ['Accounting', 'Ledger'] },
    [FRONTEND_ROUTES.RECEIVABLES]: { title: 'Receivables', crumbs: ['Accounting', 'Receivables'] },
    [FRONTEND_ROUTES.FINANCIAL_REPORTS]: { title: 'Financial reports', crumbs: ['Accounting', 'Reports'] },
    [FRONTEND_ROUTES.ADMIN_AUDIT]: { title: 'Audit log', crumbs: ['System', 'Audit'] },
    [FRONTEND_ROUTES.ADMIN_SCHEMES]: { title: 'Discount schemes', crumbs: ['Operations', 'Schemes'] },
    [FRONTEND_ROUTES.REPORTS]: { title: 'Reports', crumbs: ['Finance', 'Reports'] },
    [FRONTEND_ROUTES.EXPENSES]: { title: 'Expenses', crumbs: ['Accounting', 'Expenses'] },
    [FRONTEND_ROUTES.PROFIT_LOSS]: { title: 'Profit & Loss', crumbs: ['Accounting', 'Profit & Loss'] },

    [FRONTEND_ROUTES.USER_MANAGEMENT]: { title: 'Users', crumbs: ['People', 'Users'] },
    [FRONTEND_ROUTES.PROFILE]: { title: 'Your profile', crumbs: ['Profile'] },

    [FRONTEND_ROUTES.BRANCHES]: { title: 'My branch', crumbs: ['Branches'] },
    [FRONTEND_ROUTES.BRANCH_MANAGEMENT]: { title: 'Branch management', crumbs: ['Branches', 'Manage'] },
    [FRONTEND_ROUTES.BRANCHES_HUB]: { title: 'Branches', crumbs: ['Admin', 'Branches'] },
    [FRONTEND_ROUTES.BRANCH_COMPARE]: { title: 'Compare branches', crumbs: ['Admin', 'Compare'] },
    [FRONTEND_ROUTES.ADMIN_LOYALTY]: { title: 'Customer loyalty', crumbs: ['Admin', 'Customer loyalty'] },
    [FRONTEND_ROUTES.MANAGER_LOYALTY]: { title: 'Customer loyalty', crumbs: ['Manager', 'Customer loyalty'] },
    [FRONTEND_ROUTES.ADMIN_HR]: { title: 'HR', crumbs: ['People', 'HR'] },
    [FRONTEND_ROUTES.ADMIN_EMPLOYEES]: { title: 'Employees', crumbs: ['People', 'Employees'] },
    [FRONTEND_ROUTES.ADMIN_EMPLOYEE_NEW]: { title: 'New employee', crumbs: ['People', 'Employees', 'Add new'] },
    [FRONTEND_ROUTES.ADMIN_EMPLOYEE_EDIT]: { title: 'Edit employee', crumbs: ['People', 'Employees', 'Edit'] },
    [FRONTEND_ROUTES.ADMIN_ATTENDANCE]: { title: 'Attendance', crumbs: ['People', 'Attendance'] },
    [FRONTEND_ROUTES.ADMIN_LEAVES]: { title: 'Leaves', crumbs: ['People', 'Leaves'] },
    [FRONTEND_ROUTES.ADMIN_PAYROLL]: { title: 'Payroll', crumbs: ['People', 'Payroll'] },

    [FRONTEND_ROUTES.NOTIFICATIONS]: { title: 'Notifications', crumbs: ['Notifications'] },
    [FRONTEND_ROUTES.NOTIFICATION_DETAIL]: { title: 'Notification', crumbs: ['Notifications', 'Detail'] },

    [FRONTEND_ROUTES.TRANSFERS]: { title: 'Stock transfers', crumbs: ['Inventory', 'Transfers'] },
    [FRONTEND_ROUTES.TRANSFERS_NEW]: { title: 'New stock transfer', crumbs: ['Transfers', 'New'] },
    [FRONTEND_ROUTES.TRANSFER_HISTORY]: { title: 'Transfer history', crumbs: ['Transfers', 'History'] },
    [FRONTEND_ROUTES.TRANSFER_DETAIL]: { title: 'Transfer detail', crumbs: ['Transfers', 'Detail'] },
    [FRONTEND_ROUTES.ADMIN_TRANSFERS]: { title: 'Stock transfers', crumbs: ['Admin', 'Transfers'] },

    [FRONTEND_ROUTES.SHOP]: { title: 'Catalog', crumbs: ['Shop', 'Catalog'] },
    [FRONTEND_ROUTES.SHOP_PRODUCT_DETAIL]: { title: 'Product', crumbs: ['Shop', 'Product'] },
    [FRONTEND_ROUTES.SHOP_CART]: { title: 'Your cart', crumbs: ['Shop', 'Cart'] },
    [FRONTEND_ROUTES.SHOP_CHECKOUT]: { title: 'Checkout', crumbs: ['Shop', 'Checkout'] },
    [FRONTEND_ROUTES.SHOP_ORDER_CONFIRMATION]: { title: 'Order placed', crumbs: ['Shop', 'Confirmation'] },
    [FRONTEND_ROUTES.SHOP_MY_ORDERS]: { title: 'My orders', crumbs: ['Shop', 'My orders'] },
    [FRONTEND_ROUTES.CUSTOMER_ORDERS]: { title: 'Customer orders', crumbs: ['People', 'Customer orders'] },
};

const DYNAMIC_SEGMENT = /:[A-Za-z_][A-Za-z0-9_]*/g;

function patternToRegex(pattern: string): RegExp {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    const withWildcards = escaped.replace(DYNAMIC_SEGMENT, '[^/]+');
    return new RegExp(`^${withWildcards}$`);
}

export function getRouteMeta(pathname: string): RouteMeta | undefined {
    if (ROUTE_META[pathname]) return ROUTE_META[pathname];
    for (const pattern of Object.keys(ROUTE_META)) {
        if (pattern.includes(':')) {
            if (patternToRegex(pattern).test(pathname)) return ROUTE_META[pattern];
        }
    }
    return undefined;
}
