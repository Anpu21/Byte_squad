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

    [FRONTEND_ROUTES.INVENTORY]: { title: 'Products', crumbs: ['Inventory', 'Products'] },
    [FRONTEND_ROUTES.INVENTORY_ADD]: { title: 'New product', crumbs: ['Inventory', 'Products', 'Add new'] },
    [FRONTEND_ROUTES.INVENTORY_EDIT]: { title: 'Edit product', crumbs: ['Inventory', 'Products', 'Edit'] },

    [FRONTEND_ROUTES.POS]: { title: 'Point of Sale', crumbs: ['Operations', 'POS'] },
    [FRONTEND_ROUTES.TRANSACTIONS]: { title: 'Transactions', crumbs: ['Operations', 'Transactions'] },
    [FRONTEND_ROUTES.SCAN_REQUEST]: { title: 'Scan pickup request', crumbs: ['POS', 'Scan pickup'] },

    [FRONTEND_ROUTES.LEDGER]: { title: 'General ledger', crumbs: ['Accounting', 'Ledger'] },
    [FRONTEND_ROUTES.EXPENSES]: { title: 'Expenses', crumbs: ['Accounting', 'Expenses'] },
    [FRONTEND_ROUTES.PROFIT_LOSS]: { title: 'Profit & Loss', crumbs: ['Accounting', 'Profit & Loss'] },

    [FRONTEND_ROUTES.USER_MANAGEMENT]: { title: 'Users', crumbs: ['People', 'Users'] },
    [FRONTEND_ROUTES.PROFILE]: { title: 'Your profile', crumbs: ['Profile'] },

    [FRONTEND_ROUTES.BRANCHES]: { title: 'My branch', crumbs: ['Branches'] },
    [FRONTEND_ROUTES.BRANCH_MANAGEMENT]: { title: 'Branch management', crumbs: ['Branches', 'Manage'] },
    [FRONTEND_ROUTES.BRANCHES_HUB]: { title: 'Branches', crumbs: ['Admin', 'Branches'] },
    [FRONTEND_ROUTES.BRANCH_COMPARE]: { title: 'Compare branches', crumbs: ['Admin', 'Compare'] },

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
    [FRONTEND_ROUTES.SHOP_REQUEST_CONFIRMATION]: { title: 'Order placed', crumbs: ['Shop', 'Confirmation'] },
    [FRONTEND_ROUTES.SHOP_MY_REQUESTS]: { title: 'My requests', crumbs: ['Shop', 'My requests'] },
    [FRONTEND_ROUTES.CUSTOMER_REQUESTS]: { title: 'Customer requests', crumbs: ['People', 'Customer requests'] },
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
