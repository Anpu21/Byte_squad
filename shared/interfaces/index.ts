/**
 * LedgerPro — Shared Interfaces
 * These mirror backend DTOs for frontend consumption.
 */

import type {
    UserRole,
    TransactionType,
    DiscountType,
    PaymentMethod,
    LedgerEntryType,
    NotificationType,
} from '../constants/enums.js';

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
