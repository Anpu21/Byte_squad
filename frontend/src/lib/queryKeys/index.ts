/**
 * Centralized TanStack Query key factory.
 *
 * Rules.md §6 mandates a single source of truth for query keys per feature.
 * Every cross-component query key in the app should live here.
 *
 * Each domain key-factory lives in its own sibling file; this barrel
 * re-assembles them into the single `queryKeys` object the app imports.
 */

import { accounting } from './accounting';
import { admin } from './admin';
import { adminLoyalty } from './admin-loyalty';
import { audit } from './audit';
import { branch } from './branch';
import { branches } from './branches';
import { brands } from './brands';
import { cashierDashboard } from './cashier-dashboard';
import { categories } from './categories';
import { chat } from './chat';
import { creditAccounts } from './credit-accounts';
import { customerGroups } from './customer-groups';
import { customerOrders } from './customer-orders';
import { customers } from './customers';
import { expenses } from './expenses';
import { expiry } from './expiry';
import { heldSales } from './held-sales';
import { hr } from './hr';
import { inventory } from './inventory';
import { ledger } from './ledger';
import { loyalty } from './loyalty';
import { notifications } from './notifications';
import { pos } from './pos';
import { product } from './product';
import { profile } from './profile';
import { purchases } from './purchases';
import { receivables } from './receivables';
import { returns } from './returns';
import { reviews } from './reviews';
import { shifts } from './shifts';
import { shipments } from './shipments';
import { shop } from './shop';
import { stockAdjustments } from './stock-adjustments';
import { stockTransfers } from './stock-transfers';
import { transactions } from './transactions';
import { users } from './users';

export type { AdminInventoryMatrixFilters } from './admin';
export type {
    ListEmployeesQueryKey,
    ListAttendanceQueryKey,
    ListLeavesQueryKey,
    ListPayrollQueryKey,
} from './hr';

export const queryKeys = {
    admin,
    inventory,
    categories,
    brands,
    expiry,
    stockAdjustments,
    returns,
    notifications,
    stockTransfers,
    branches,
    shop,
    reviews,
    profile,
    expenses,
    product,
    users,
    customerOrders,
    customerGroups,
    customers,
    chat,
    loyalty,
    hr,
    purchases,
    receivables,
    creditAccounts,
    shifts,
    heldSales,
    audit,
    shipments,
    adminLoyalty,
    cashierDashboard,
    transactions,
    branch,
    ledger,
    accounting,
    pos,
} as const;
