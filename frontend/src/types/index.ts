/**
 * LedgerPro — Type Definitions
 * Interfaces mirror backend DTOs for frontend consumption.
 */

import type {
    UserRole,
    TransactionType,
    DiscountType,
    PaymentMethod,
    LedgerEntryType,
    NotificationType,
} from '@/constants/enums';

// ─── User ────────────────────────────────────────────────────────────────────

export interface IUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    role: UserRole;
    branchId: string;
    isFirstLogin: boolean;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface IUserCreatePayload {
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    branchId: string;
}

// ─── Branch ──────────────────────────────────────────────────────────────────

export interface IBranch {
    id: string;
    name: string;
    address: string;
    phone: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface IBranchCreatePayload {
    name: string;
    address: string;
    phone?: string;
}

export interface IBranchUpdatePayload {
    name?: string;
    address?: string;
    phone?: string;
    isActive?: boolean;
}

// ─── Super Admin ─────────────────────────────────────────────────────────────

export interface IBranchWithMeta extends IBranch {
    adminName: string | null;
    adminEmail: string | null;
    staffCount: number;
}

export interface IAdminWithBranch {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    branchId: string;
    branchName: string | null;
    isVerified: boolean;
    lastLoginAt: string | null;
    createdAt: string;
}

export interface IBranchPerformance {
    branchId: string;
    branchName: string;
    isActive: boolean;
    todaySales: number;
    todayTransactions: number;
    staffCount: number;
    activeProducts: number;
    lowStockItems: number;
    adminName: string | null;
}

export interface IOverviewSummary {
    totalRevenueToday: number;
    totalTransactionsToday: number;
    activeBranches: number;
    inactiveBranches: number;
    totalStaff: number;
}

export interface IOverviewAlert {
    type: 'no_admin' | 'no_transactions' | 'critical_low_stock' | 'inactive_branch';
    branchId: string;
    branchName: string;
    message: string;
}

export interface IOverviewResponse {
    summary: IOverviewSummary;
    branches: IBranchPerformance[];
    alerts: IOverviewAlert[];
}

export interface IUserWithBranch {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    branchId: string;
    branchName: string | null;
    isVerified: boolean;
    lastLoginAt: string | null;
    createdAt: string;
}

export interface IComparisonTopProduct {
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
}

export interface IBranchComparisonEntry {
    branchId: string;
    branchName: string;
    revenue: number;
    expenses: number;
    expenseRatio: number;
    transactionCount: number;
    avgTransactionValue: number;
    staffCount: number;
    revenuePerStaff: number;
    topProducts: IComparisonTopProduct[];
}

export interface IBranchComparisonResponse {
    startDate: string;
    endDate: string;
    branches: IBranchComparisonEntry[];
}

export interface IBranchComparisonRequest {
    branchIds: string[];
    startDate: string;
    endDate: string;
}

// ─── My Branch Performance (Admin/Manager) ──────────────────────────────────

export interface IMyBranchInfo {
    id: string;
    name: string;
    address: string;
    phone: string;
    isActive: boolean;
    createdAt: string;
}

export interface IMyBranchAdmin {
    name: string;
    email: string;
}

export interface IMyBranchTodayKpis {
    sales: number;
    transactions: number;
    avgTransaction: number;
}

export interface IMyBranchDailyPoint {
    date: string;
    sales: number;
    transactions: number;
}

export interface IMyBranchWeekKpis {
    sales: number;
    transactions: number;
    dailyBreakdown: IMyBranchDailyPoint[];
}

export interface IMyBranchMonthKpis {
    revenue: number;
    expenses: number;
    netProfit: number;
    transactions: number;
}

export interface IMyBranchStaff {
    total: number;
    byRole: {
        admin: number;
        manager: number;
        accountant: number;
        cashier: number;
    };
}

export interface IMyBranchInventory {
    totalProducts: number;
    activeProducts: number;
    lowStockItems: number;
    outOfStock: number;
}

export interface IMyBranchTopProduct {
    productId: string;
    name: string;
    quantity: number;
    revenue: number;
}

export interface IMyBranchLowStockItem {
    productId: string;
    name: string;
    quantity: number;
    threshold: number;
}

export interface IMyBranchRecentTransaction {
    id: string;
    transactionNumber: string;
    total: number;
    cashierName: string;
    createdAt: string;
}

export interface IMyBranchPerformance {
    branch: IMyBranchInfo;
    admin: IMyBranchAdmin | null;
    today: IMyBranchTodayKpis;
    week: IMyBranchWeekKpis;
    month: IMyBranchMonthKpis;
    staff: IMyBranchStaff;
    inventory: IMyBranchInventory;
    topProducts: IMyBranchTopProduct[];
    lowStockList: IMyBranchLowStockItem[];
    recentTransactions: IMyBranchRecentTransaction[];
}

// ─── Product ─────────────────────────────────────────────────────────────────

export interface IProduct {
    id: string;
    name: string;
    barcode: string;
    description: string;
    category: string;
    costPrice: number;
    sellingPrice: number;
    imageUrl: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export interface IInventory {
    id: string;
    productId: string;
    branchId: string;
    quantity: number;
    lowStockThreshold: number;
    lastRestockedAt: string | null;
    updatedAt: string;
}

export interface IInventoryWithProduct extends IInventory {
    product: IProduct;
}

// ─── Transaction (POS) ──────────────────────────────────────────────────────

export interface ITransaction {
    id: string;
    transactionNumber: string;
    branchId: string;
    cashierId: string;
    type: TransactionType;
    subtotal: number;
    discountAmount: number;
    discountType: DiscountType;
    taxAmount: number;
    total: number;
    paymentMethod: PaymentMethod;
    createdAt: string;
}

export interface ITransactionItem {
    id: string;
    transactionId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    discountType: DiscountType;
    lineTotal: number;
}

// ─── Accounting ──────────────────────────────────────────────────────────────

export interface ILedgerEntry {
    id: string;
    branchId: string;
    entryType: LedgerEntryType;
    amount: number;
    description: string;
    referenceNumber: string;
    transactionId: string | null;
    createdAt: string;
}

export interface IExpense {
    id: string;
    branchId: string;
    createdBy: string;
    category: string;
    amount: number;
    description: string;
    expenseDate: string;
    receiptUrl: string | null;
    createdAt: string;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface INotification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    metadata: Record<string, unknown>;
    createdAt: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface ILoginPayload {
    email: string;
    password: string;
}

export interface IAuthResponse {
    accessToken: string;
    user: IUser;
}

export interface IOtpVerifyPayload {
    email: string;
    otpCode: string;
}

// ─── API Response ────────────────────────────────────────────────────────────

export interface IApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

export interface IPaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ─── Cashier Dashboard ──────────────────────────────────────────────────────

export interface IDailyBreakdown {
    date: string;
    totalSales: number;
    transactionCount: number;
}

export interface ITopProduct {
    productId: string;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
}

export interface IAdminDashboard {
    today: {
        totalSales: number;
        transactionCount: number;
        averageSale: number;
    };
    week: {
        totalSales: number;
        transactionCount: number;
    };
    month: {
        totalRevenue: number;
        transactionCount: number;
    };
    stats: {
        activeProducts: number;
        lowStockItems: number;
        totalUsers: number;
        totalBranches: number;
    };
    dailyBreakdown: IDailyBreakdown[];
    topProducts: ITopProduct[];
    recentTransactions: ITransaction[];
}

export interface ICashierDashboard {
    today: {
        totalSales: number;
        transactionCount: number;
        averageSale: number;
    };
    week: {
        totalSales: number;
        transactionCount: number;
    };
    dailyBreakdown: IDailyBreakdown[];
    recentTransactions: ITransaction[];
}

// ─── User Profile ───────────────────────────────────────────────────────────

export interface IUserProfile extends IUser {
    branch?: IBranch;
}

// ─── Frontend-specific Types ─────────────────────────────────────────────────

export interface SidebarNavItem {
    label: string;
    path: string;
    icon: string;
    roles: string[];
}

export interface ChartDataPoint {
    label: string;
    value: number;
}

export interface DailySalesData {
    date: string;
    totalSales: number;
    totalTransactions: number;
    profit: number;
}

export interface TopSellingItem {
    productId: string;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
}
