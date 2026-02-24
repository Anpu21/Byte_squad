/**
 * Frontend-specific type definitions.
 * Shared types are in @shared/interfaces.
 */

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
